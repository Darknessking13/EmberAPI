/**
 * EmberAPI Test Server for Benchmarking
 */

import { EmberAPI } from 'emberapi';

const app = new EmberAPI();

// Routes
app.get('/', (req, res) => {
    return res.json({ message: 'Hello World' });
});

app.get('/users', (req, res) => {
    return res.json({ users: [] });
});

app.get('/users/:id', (req, res, params) => {
    return res.json({ id: params.id, name: 'John Doe', email: 'john@example.com' });
});

app.post('/users', (req, res) => {
    return res.json({ id: '123', ...req.body }, 201);
});

app.get('/users/:id/posts', (req, res, params) => {
    return res.json({ userId: params.id, posts: [] });
});

app.get('/posts/:id/comments/:commentId', (req, res, params) => {
    return res.json({ postId: params.id, commentId: params.commentId, text: 'Comment text' });
});

// Launch server
app.launch(3100, () => {
    console.log('EmberAPI server listening on port 3100');
});
