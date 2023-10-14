package com.react.project;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class OpenAIApi {
    private static final String API_KEY = "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";

    public String ask(String prompt){
        String responeBody = "";

        JSONArray messages = new JSONArray();
        messages.put(new JSONObject().put("role", "system").put("content", "You are a helpful assistant."));
        String combinedPrompt = prompt + "보낸 자소서를 참고해서 질문에 대한 대답해주고 한국어로 대답해줘";
        messages.put(new JSONObject().put("role", "user").put("content", combinedPrompt));

        JSONObject jsonBody = new JSONObject();
        jsonBody.put("messages", messages);
        jsonBody.put("max_tokens", 1000);
        jsonBody.put("temperature", 0.8);
        jsonBody.put("model", "gpt-3.5-turbo");

        try{
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.openai.com/v1/chat/completions"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + API_KEY)
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody.toString()))
                    .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            responeBody = extractAnswer(response.body());

        } catch (Exception e) {
            e.printStackTrace();
        }

        return responeBody;
    }

    public String askAnalysis(String prompt){
        String responeBody = "";

        JSONArray messages = new JSONArray();
        messages.put(new JSONObject().put("role", "system").put("content", "You are a helpful assistant."));
        messages.put(new JSONObject().put("role", "user").put("content", prompt));

        JSONObject jsonBody = new JSONObject();
        jsonBody.put("messages", messages);
        jsonBody.put("max_tokens", 500);
        jsonBody.put("temperature", 0.8);
        jsonBody.put("model", "gpt-4");

        try{
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.openai.com/v1/chat/completions"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + API_KEY)
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody.toString()))
                    .build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            responeBody = extractAnswer(response.body());

        } catch (Exception e) {
            e.printStackTrace();
        }

        return responeBody;
    }


    private String extractAnswer(String responseJson){
        JSONObject jsonObject = new JSONObject(responseJson);

        if(jsonObject.has("choices")){
            JSONObject choice = jsonObject.getJSONArray("choices").getJSONObject(0);
            if(choice.has("message")) { // message 키가 있는지 확인
                JSONObject message = choice.getJSONObject("message");
                if(message.has("content")) { // content 키가 있는지 확인
                    return message.getString("content").trim();
                } else {
                    System.out.println("Error: 'content' key not found in message: " + message.toString());
                }
            } else {
                System.out.println("Error: 'message' key not found in choice: " + choice.toString());
            }
        } else {
            System.out.println("Error: 'choices' key not found in response: " + responseJson);
        }
        return "API 호출 중 오류가 발생했습니다. ";
    }
}
