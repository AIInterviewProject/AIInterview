package com.react.project.service;

import io.netty.channel.ChannelOption;
import net.bramp.ffmpeg.FFmpeg;
import net.bramp.ffmpeg.FFmpegExecutor;
import net.bramp.ffmpeg.FFprobe;
import net.bramp.ffmpeg.builder.FFmpegBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.http.HttpStatus;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import reactor.netty.http.client.HttpClient;
import reactor.util.retry.Retry;

@Service
public class ASRService {

    private final WebClient webClient;

    private static final Logger logger = LoggerFactory.getLogger(ASRService.class);

    @Value("${etri.asr.url}")
    private String openApiURL;

    @Value("${etri.asr.key}")
    private String accessKey;

    // ffmpeg와 ffprobe의 위치를 지정합니다.
    private String ffmpegPath = "C:\\ffmpeg\\bin\\ffmpeg.exe";
    private String ffprobePath = "C:\\ffmpeg\\bin\\ffprobe.exe";

    public ASRService() {
        // WebClient 생성 시 타임아웃 설정
        this.webClient = WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(
                        HttpClient.create()
                                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 1000000)  // 200
                                .responseTimeout(Duration.ofSeconds(1000))  // 100
                ))
                .build();

    }

    // ffmpeg를 사용하여 오디오 파일을 MP3로 변환하는 메서드
    private Path convertToMp3(MultipartFile file) throws IOException {
        logger.info("Converting to MP3 format");

        // 임시 원본 파일 생성
        Path tempFile = Files.createTempFile("audio", ".webm");
        Files.write(tempFile, file.getBytes());
        logger.info("Temporary file created at {}", tempFile);

        // 결과 MP3 파일 경로
        Path mp3File = Files.createTempFile("audio", ".mp3");

        // FFmpeg 객체 생성
        FFmpeg ffmpeg = new FFmpeg(ffmpegPath);
        FFprobe ffprobe = new FFprobe(ffprobePath);

        // FFmpeg 명령 생성
        FFmpegBuilder builder = new FFmpegBuilder()
                .setInput(tempFile.toString())  // 원본 파일 설정
                .overrideOutputFiles(true)      // 출력 파일이 존재할 경우 덮어쓰기
                .addOutput(mp3File.toString())  // 결과 파일 설정
                .setAudioChannels(1)            // 오디오 채널 설정 (모노)
                .setAudioCodec("libmp3lame")    // 오디오 코덱 설정
                .setAudioSampleRate(8000)      // 샘플 레이트 설정
                .setAudioBitRate(32000)         // 비트레이트 설정
                .done();

        // 작업 실행
        FFmpegExecutor executor = new FFmpegExecutor(ffmpeg, ffprobe);
        executor.createJob(builder).run();

        // 임시 원본 파일 삭제
        Files.delete(tempFile);
        logger.info("Original temp file deleted successfully.");

        // 변환된 MP3 파일 정보 로깅
        logger.info("Conversion to MP3 completed successfully, MP3 file at {}", mp3File);

        // 변환된 MP3 파일의 경로를 반환
        return mp3File;
    }

    // 변환된 파일을 전송하는 메서드
    private Mono<String> sendFile(Path mp3File, String languageCode) {
        byte[] fileContent;
        try {
            fileContent = Files.readAllBytes(mp3File);
        } catch (IOException e) {
            logger.error("Failed to read converted audio file", e);
            return Mono.error(e);
        }

        String audioContents = Base64.getEncoder().encodeToString(fileContent);
        Map<String, Object> request = new HashMap<>();
        Map<String, String> argument = new HashMap<>();

        argument.put("language_code", languageCode);
        argument.put("audio", audioContents);
        request.put("argument", argument);

        return webClient.post()
                .uri(openApiURL)
                .header("Content-Type", "application/json; charset=UTF-8")
                .header("Authorization", accessKey)
                .bodyValue(request)
                .retrieve()
                .onStatus(status -> status.isError(), clientResponse ->
                        clientResponse.bodyToMono(String.class).flatMap(errorBody -> {
                            logger.error("Error from external API: {} with status code {}", errorBody, clientResponse.statusCode());
                            return Mono.error(new RuntimeException("Error from external API: " + errorBody));
                        })
                )

                .bodyToMono(String.class)
                .doOnSuccess(response -> logger.info("Success response from external API: {}", response))
                .doOnError(e -> logger.error("Error while sending file to external API", e));
    }


    // 클라이언트로부터 받은 파일을 변환하고 전송하는 메서드
    public Mono<String> recognizeSpeech(MultipartFile file, String languageCode) {
        logger.info("Starting to process the audio file.");
        try {
            Path mp3File = convertToMp3(file);
            logger.info("Audio file converted to MP3 successfully.");

            return sendFile(mp3File, languageCode)
                    .doOnNext(response -> logger.info("Received response from external API: {}", response))
                    .doOnError(error -> logger.error("Error during sending file to external API", error))
                    .doFinally(signalType -> {
                        try {
                            Files.delete(mp3File); // 처리 후 MP3 파일 삭제
                            logger.info("Temporary mp3 file deleted successfully.");
                        } catch (IOException e) {
                            logger.error("Failed to delete temporary mp3 file", e);
                        }
                    });
        } catch (IOException e) {
            logger.error("Error processing audio file", e);
            return Mono.error(e);
        }
    }
}

