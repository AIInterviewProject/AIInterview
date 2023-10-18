import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {Container, Typography, Divider, Box, Button, TextField, Grid} from '@mui/material';
import { useCookies } from "react-cookie";
import Avatar from "@mui/material/Avatar";

const BoardDetail = () => {
    const [boardDetail, setBoardDetail] = useState({});
    const [currentUser, setCurrentUser] = useState({});  // 현재 사용자 정보를 저장할 state
    const { boardId } = useParams();
    const navigate = useNavigate();
    const [cookies] = useCookies(['token']);
    const [comments, setComments] = useState([]);  // 댓글 리스트
    const [comment, setComment] = useState('');

    useEffect(() => {
        const fetchBoardDetail = async () => {
            try {
                const response = await axios.get(`/board/${boardId}`);
                setBoardDetail(response.data);
            } catch (error) {
                console.error("Error fetching board details:", error);
            }
        };

        const fetchCurrentUser = async () => {
            const token = cookies.token;

            if (token) {
                try {
                    const response = await axios.get('/api/auth/currentUser', {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    setCurrentUser(response.data);
                } catch (error) {
                    console.error("Error fetching current user:", error);
                }
            }
        };

        fetchBoardDetail();
        fetchCurrentUser();
    }, [boardId, cookies.token]);

    const handleEdit = () => {
        navigate(`/board/edit/${boardId}`);
    }

    const handleDelete = async () => {
        try {
            await axios.delete(`/board/${boardId}`);
            alert('게시글이 삭제되었습니다.');
            navigate('/board');
        } catch (error) {
            console.error("Error deleting post:", error);
            alert('게시글 삭제에 실패했습니다.');
        }
    }

    const handleGoToBoardList = () => {
        navigate('/board');
    }

    // 댓글을 서버에 전송하는 함수
    const handlePostComment = async () => {
        try {
            const response = await axios.post(`/board/${boardId}/comment`, { text: comment });
            setComments([...comments, response.data]);  // 새로운 댓글을 목록에 추가
            setComment('');  // 입력 양식 초기화
        } catch (error) {
            console.error("Error posting comment:", error);
        }
    };

    return (
        <Container maxWidth="md">
            <Box my={4}>
                <Typography variant="h4" gutterBottom>
                    {boardDetail.boardTitle}
                </Typography>
                <Divider />
                <Box my={2}>
                    <Typography variant="subtitle1" color="textSecondary">
                        작성자: {boardDetail.boardWriterNickname}
                    </Typography>
                    <Typography variant="subtitle1" color="textSecondary">
                        작성 날짜: {boardDetail.boardWriteDate}
                    </Typography>
                </Box>
                <Typography variant="body1">
                    {boardDetail.boardContent}
                </Typography>
                {boardDetail.boardImage && (
                    <Box my={2}>
                        <img
                            src={boardDetail.boardImage}
                            alt="Board Image"
                            style={{ width: '100%', maxHeight: 500, objectFit: 'cover' }}
                        />
                    </Box>
                )}

                <Box mt={5} display="flex" justifyContent="flex-end">
                    {currentUser.userNickname === boardDetail.boardWriterNickname && (
                        <>
                            <Button variant="contained" color="primary" style={{ marginRight: '10px' }} onClick={handleEdit}>
                                수정
                            </Button>
                            <Button variant="contained" color="secondary" style={{ marginRight: '10px' }} onClick={handleDelete}>
                                삭제
                            </Button>
                        </>
                    )}
                    <Button variant="outlined" onClick={handleGoToBoardList}>
                        목록
                    </Button>
                </Box>
            </Box>
            <Divider style={{ marginTop: '20px', marginBottom: '20px' }} />
            <Typography variant="h5">댓글</Typography>
            <Box>
                {comments.map((comment, index) => (
                    <Box key={index} style={{ marginBottom: '10px' }}>
                        <Typography variant="subtitle1">{comment.user}</Typography>
                        <Typography variant="body2">{comment.text}</Typography>
                    </Box>
                ))}
            </Box>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={10}>
                    <TextField
                        fullWidth
                        label="댓글 작성"
                        variant="outlined"
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                    />
                </Grid>
                <Grid item xs={2}>
                    <Button variant="contained" onClick={handlePostComment}>
                        댓글 등록
                    </Button>
                </Grid>
            </Grid>
        </Container>
    );
}

export default BoardDetail;