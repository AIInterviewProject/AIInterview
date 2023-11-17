package com.react.project.controller;

import com.react.project.AnalysisResult;
import com.react.project.service.AnalysisService;
import com.react.project.service.AuthService;
import org.json.simple.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
public class AnalysisController {

    @Autowired
    AnalysisService analysisService;
    @PostMapping("/api/checkPlagiarism")
    public AnalysisResult analyze(@RequestBody String content) {
        // 실제 분석 서비스를 호출하여 결과를 받아옵니다.
        AnalysisResult result = analysisService.analyze(content);
        return result;
    }

    @PostMapping("/api/checkSpellingWithGPT")
    public ResponseEntity<Map<String, String>> checkSpelling(@RequestBody String content) {
        String correctedText = analysisService.checkSpellingWithGPT(content);
        Map<String, String> response = new HashMap<>();
        response.put("corrected_text", correctedText);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/analyzeKeywords")
    public ResponseEntity<List<JSONObject>> analyzeKeywords(@RequestBody String content) {
        List<JSONObject> results = analysisService.analyzeKeywords(content);
        return ResponseEntity.ok(results);
    }

    @PostMapping("/api/getAnalysisResults")
    public ResponseEntity<Map<String, Integer>> getAnalysisResults(@RequestBody String content) {
        Map<String, Integer> results = analysisService.getAnalysisResults(content);
        return ResponseEntity.ok(results);
    }

    @PostMapping("/v1/analyzeSentiments")
    public ResponseEntity<String> analyzeSentiments(@RequestBody String content) {
        String result = analysisService.interviewAnswerAnalysis(content);
        return ResponseEntity.ok(result);
    }

}
