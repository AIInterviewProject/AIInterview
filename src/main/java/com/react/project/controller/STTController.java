package com.react.project.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;

@RestController
@RequestMapping("/stt")
public class STTController {

    private static final String openApiURL = "http://aiopen.etri.re.kr:8000/WiseASR/Recognition";
    private static final String accessKey = "383d2c57-46f2-4a4b-819c-927aa7516fa4";
    private static final String languageCode = "ko-KR";

    @PostMapping("/recognize")
    public ResponseEntity<String> recognizeSpeech(@RequestParam("file") MultipartFile audioFile) {
        try {
            byte[] audioBytes = audioFile.getBytes();
            String audioContents = Base64.getEncoder().encodeToString(audioBytes);

            String requestJson = "{ 'argument': { 'language_code': '" + languageCode + "', 'audio': '" + audioContents + "' } }";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", accessKey);

            HttpEntity<String> requestEntity = new HttpEntity<>(requestJson, headers);

            ResponseEntity<String> responseEntity = new RestTemplate().exchange(openApiURL, HttpMethod.POST, requestEntity, String.class);

            return responseEntity;
        } catch (IOException e) {
            return new ResponseEntity<>("Error reading audio file.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
