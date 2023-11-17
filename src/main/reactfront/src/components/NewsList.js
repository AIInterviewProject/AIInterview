import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import NewsItem from './NewsItem';
import axios from 'axios';

const NewsListBlock = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  width: 1300px;
  margin: 0 auto;
  margin-top: 2rem;
  margin-bottom: 50px;
  @media screen and (max-width: 1000px){
    flex-direction: column;
    width: 100%;
    padding-left: 1rem;
    padding-right: 1rem;
  }
`;

const Title = styled.h1`
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 2rem;
    font-weight: bold;
    color: #999aae;
`;

const NewsList = () => {
    const [articles, setArticles] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(
                    'https://newsapi.org/v2/everything?q=취업 OR 구인 OR 구직&language=ko&apiKey=0bacc4212d814944a2ba59ee7cdc2e1b',
                );
                const articlesFromResponse = response.data.articles;
                setArticles(articlesFromResponse);
            } catch(e) {
                console.log(e);
            }
            setLoading(false);
        };
        fetchData();
    }, []);
    if (loading) {
        return <NewsListBlock>뉴스 불러오는 중...</NewsListBlock>
    }

    if (!articles){
        return null;
    }

    return (
        <NewsListBlock>
            <div>
                <Title>TODAY NEWS</Title>
                {articles.slice(0, 5).map(article => (
                    <NewsItem key={article.url} article={article} setSelectedImage={setSelectedImage} />
                ))}
            </div>
            <div>
                {selectedImage ? (
                    <img
                        src={selectedImage}
                        alt="Selected Thumbnail"
                        style={{width: '460px', height: '410px', marginTop: '80px'}}
                    />
                ) : (
                    <img
                        src="/img/img/TodayNews.png"
                        alt="Default Thumbnail"
                        style={{width: '460px', height: '410px', marginTop: '80px'}}
                    />
                )}
            </div>
        </NewsListBlock>
    );
};

export default NewsList;