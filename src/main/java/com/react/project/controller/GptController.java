package com.react.project.controller;

import com.react.project.service.GptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
public class GptController {
    private final GptService gptService;

    @Autowired
    public GptController(GptService gptService){
        this.gptService = gptService;
    }

    @PostMapping("/ask")
    public String ask(@RequestBody String prompt){
        return gptService.ask(prompt);
    }

    @PostMapping("/question")
    public String question(@RequestBody String prompt){
        return gptService.question(prompt);
    }

    @PostMapping("/analysisAnswer")
    public String analysisAnswer(@RequestBody String prompt){
        return gptService.analysisAnswer(prompt);
    }

}