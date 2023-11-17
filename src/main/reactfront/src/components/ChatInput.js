import React, {useState} from "react";

const ChatInput = ({onSubmit}) => {
    const [inputValue, setInputValue] = useState("");

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit(inputValue);
        setInputValue("");
    };

    return(
        <form onSubmit={handleSubmit} className="chat-input" >
            <input
                type="text"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Type your message..."
            />
            <button type="submit">전송</button>
        </form>
    );
};

export default ChatInput;