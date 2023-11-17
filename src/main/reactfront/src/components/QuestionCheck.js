import React, {useEffect, useState} from "react";
import axios from "axios";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import {useCookies} from "react-cookie";
import {useUserStore} from "../stores";

const QuestionCheck = ({ introContent, onGptResponse }) => {
    const [messages, setMessages] = useState([]);
    const [projectResponse, setProjectResponse] = useState('');
    const [cookies] = useCookies();
    const {user} = useUserStore();
    const [isLoaded, setIsLoaded] = useState(false);

    const getProject = async (token) => {
        const requestOption = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
        await axios.get('http://localhost:8080/api/project/', requestOption).then((response) => {
            setProjectResponse(response.data);
        }).catch((error) => '');
    }

    useEffect(() => {
        // 컴포넌트가 마운트될 때 GPT에 자소서를 보냄
        const sendIntroToGPT = async () => {
            if (introContent && typeof introContent === 'string') { // 문자열인지 확인
                try {
                    await axios.post("http://localhost:8080/analysisAnswer", { prompt: introContent }, {
                        headers: {
                            'Authorization': 'Bearer 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',
                        }
                    });
                    setIsLoaded(true);
                } catch (error) {
                    console.error("Error fetching GPT response for intro: ", error);
                }
            }
        };

        sendIntroToGPT();
    }, [introContent]);

    useEffect(() => {
        const token = cookies.token;
        console.log("Token Value: ", token); // 콘솔에 token 값 출력
        if(token){
            getProject(token);
        }else{
            setProjectResponse('');
        }
    }, [cookies.token]);

    const addMessage = (message, isUser) => {
        setMessages((prevMessages) => [...prevMessages, {text: message, isUser}]);
    };

    const handleSubmit = async (message) => {
        addMessage(message, true);

        try {
            const response = await axios.post("http://localhost:8080/analysisAnswer", { prompt: message }, {
                headers: {
                    'Authorization': 'Bearer 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',
                }
            });

            if (response.data) {
                addMessage(response.data, false);
                // GPT 응답을 부모 컴포넌트로 전달
                onGptResponse(response.data);
            }
        } catch (error) {
            console.error("GPT 응답을 가져오는 중 오류 발생: ", error);
        }
    };

    useEffect(() => {
        if (isLoaded) {
            const automaticMessage = introContent + '이게 내가 진행한 면접 질문이랑 답변인데 답변에서 고칠점이랑 잘한 점 등을 분석해줘';
            handleSubmit(automaticMessage);
        }
    }, [isLoaded]);

    return (
        <div className="chat-window">
            {isLoaded ? ( // 채팅 화면의 표시 여부를 결정
                <>
                    <div className="chat-messages">
                        {messages.map((message, index) => (
                            <ChatMessage
                                key={index}
                                message={message.text}
                                isUser={message.isUser}
                            />
                        ))}
                    </div>
                    <ChatInput onSubmit={handleSubmit}/>
                </>
            ) : (
                <p>챗봇 불러오는중...</p> // 로딩 중일 때의 메시지
            )}
        </div>
    );
};

export default QuestionCheck;