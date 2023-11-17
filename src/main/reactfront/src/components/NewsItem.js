import React from 'react';
import styled from 'styled-components';

const NewsItemBlock = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #666666;
  padding: 1rem 0;
  margin-bottom: 0.8rem;

  .contents h2 {
    margin: 0;
    a {
      color: black;
      font-size: 1.5rem;
      &:hover {
        text-decoration: underline;
      }
    }
  }
`;

const NewsItem = ({ article, setSelectedImage }) => {
    const { title, url, urlToImage } = article;

    return (
        <NewsItemBlock>
            <div className='contents'>
                <h2 onMouseOver={() => setSelectedImage(urlToImage)}>
                    <a href={url} target='_blank' rel='noopener noreferrer'>
                        {title}
                    </a>
                </h2>
            </div>
        </NewsItemBlock>
    );
};

export default NewsItem;