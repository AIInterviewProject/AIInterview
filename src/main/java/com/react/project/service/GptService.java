package com.react.project.service;
import com.react.project.OpenAIApi;
import org.springframework.stereotype.Service;

@Service
public class GptService {
    private final OpenAIApi openAiApi;

    public GptService(){
        this.openAiApi = new OpenAIApi();
    }

    public String ask(String prompt){
        return openAiApi.ask(prompt);
    }

    public String question(String prompt){
        return openAiApi.question(prompt);
    }

    public String analysisAnswer(String prompt){ return openAiApi.analysisAnswer(prompt);}
}