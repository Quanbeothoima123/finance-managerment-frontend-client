import React from 'react';
import { Layout } from '../components/Layout';
import PostDetail from './PostDetail';

export default function PostDetailWithLayout() {
  return (
    <Layout title="Bai viet">
      <PostDetail />
    </Layout>
  );
}
