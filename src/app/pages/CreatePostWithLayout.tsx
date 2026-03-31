import React from 'react';
import { Layout } from '../components/Layout';
import CreatePost from './CreatePost';

export default function CreatePostWithLayout() {
  return (
    <Layout title="Tao bai viet">
      <CreatePost />
    </Layout>
  );
}
