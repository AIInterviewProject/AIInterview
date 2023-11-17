import React, {useEffect, useRef, useState} from "react";
import axios from "axios";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import {useCookies} from "react-cookie";
import {useUserStore} from "../stores";

const ChatWindow = ({ introContent }) => {
    const [messages, setMessages] = useState([]);
    const [projectResponse, setProjectResponse] = useState('');
    const [cookies] = useCookies();
    const {user} = useUserStore();
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
            if (introContent && introContent.length > 0) {
                // 자소서의 모든 항목을 하나의 문자열로 합칩니다.
                const combinedContent = introContent.map(item => item.answer).join('\n\n');

                try {
                    await axios.post("http://localhost:8080/ask", { prompt: combinedContent }, {
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
        setIsLoading(true);  // 메시지를 보낼 때 로딩 상태를 true로 설정

        try {
            const response = await axios.post("http://localhost:8080/ask", { prompt: message }, {
                headers: {
                    'Authorization': 'Bearer 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',
                }
            });

            setIsLoading(false);  // 응답을 받았을 때 로딩 상태를 false로 설정

            if (response.data) {
                addMessage(response.data, false);
            }
        } catch (error) {
            console.error("Error fetching GPT response: ", error);
            setIsLoading(false);  // 에러가 발생했을 때 로딩 상태를 false로 설정
        }
    };

    return (
        <div className="chat-window">
            {isLoaded ? (
                <>
                    <div className="chat-messages">
                        {messages.map((message, index) => (
                            <ChatMessage
                                key={index}
                                message={message.text}
                                isUser={message.isUser}
                            />
                        ))}
                        {isLoading && <ChatMessage message="대답 생성중..." isUser={false} />}
                        <div ref={messagesEndRef} />
                    </div>
                    <ChatInput onSubmit={handleSubmit} />
                </>
            ) : (
                <p>챗봇 불러오는중...</p>
            )}
        </div>
    );
};
export default ChatWindow;