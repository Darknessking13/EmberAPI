/**
 * Express Test Server for Benchmarking
 */

import express from 'express';

const app = express();

app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Hello World' });
});

app.get('/users', (req, res) => {
    res.json({ users: [] });
});

app.get('/users/:id', (req, res) => {
    res.json({ id: req.params.id, name: 'John Doe', email: 'john@example.com' });
});

app.post('/users', (req, res) => {
    res.status(201).json({ id: '123', ...req.body });
});

app.get('/users/:id/posts', (req, res) => {
    res.json({ userId: req.params.id, posts: [] });
});

app.get('/posts/:id/comments/:commentId', (req, res) => {
    res.json({
        postId: req.params.id,
        commentId: req.params.commentId,
        text: 'Comment text',
    });
});

// Start server
app.listen(3100, () => {
    console.log('Express server listening on port 3100');
});
