package com.react.project.controller;

import com.react.project.service.ASRService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/asr")
public class ASRController {

    private final ASRService asrService;

    @Autowired
    public ASRController(ASRService asrService) {
        this.asrService = asrService;
    }

    @PostMapping("/recognize")
    public Mono<Map<String, String>> recognizeSpeech(@RequestParam("audioFile") MultipartFile file, @RequestParam("languageCode") String languageCode) {
        return asrService.recognizeSpeech(file, languageCode)
                .map(text -> Collections.singletonMap("recognizedText", text));
    }
}

