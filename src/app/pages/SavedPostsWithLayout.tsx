import React from 'react';
import { Layout } from '../components/Layout';
import SavedPosts from './SavedPosts';

export default function SavedPostsWithLayout() {
  return (
    <Layout title="Da luu">
      <SavedPosts />
    </Layout>
  );
}
