/**
 * Fastify Test Server for Benchmarking
 */

import Fastify from 'fastify';

const fastify = Fastify({
    logger: false,
});

// Routes
fastify.get('/', async (request, reply) => {
    return { message: 'Hello World' };
});

fastify.get('/users', async (request, reply) => {
    return { users: [] };
});

fastify.get<{ Params: { id: string } }>('/users/:id', async (request, reply) => {
    return { id: request.params.id, name: 'John Doe', email: 'john@example.com' };
});

fastify.post('/users', async (request, reply) => {
    reply.code(201);
    return { id: '123', ...request.body };
});

fastify.get<{ Params: { id: string } }>('/users/:id/posts', async (request, reply) => {
    return { userId: request.params.id, posts: [] };
});

fastify.get<{ Params: { id: string; commentId: string } }>(
    '/posts/:id/comments/:commentId',
    async (request, reply) => {
        return {
            postId: request.params.id,
            commentId: request.params.commentId,
            text: 'Comment text',
        };
    }
);

// Start server
fastify.listen({ port: 3100 }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Fastify server listening on ${address}`);
});
