/**
 * Request Context - Wraps the incoming request
 */
class RequestContext {
    constructor(req) {
        this.raw = req;
        this._body = null;
        this._bodyParsed = false;
    }

    get headers() {
        return Object.fromEntries(this.raw.headers.entries());
    }

    get url() {
        return new URL(this.raw.url);
    }

    get method() {
        return this.raw.method;
    }

    async body() {
        if (this._bodyParsed) return this._body;

        const contentType = this.raw.headers.get('content-type') || '';

        try {
            if (contentType.includes('application/json')) {
                this._body = await this.raw.json();
            } else if (contentType.includes('application/x-www-form-urlencoded')) {
                const text = await this.raw.text();
                this._body = Object.fromEntries(new URLSearchParams(text));
            } else if (contentType.includes('text/')) {
                this._body = await this.raw.text();
            } else {
                this._body = await this.raw.text();
            }
        } catch (error) {
            this._body = null;
        }

        this._bodyParsed = true;
        return this._body;
    }
}

/**
 * Response Context - Wraps the outgoing response
 */
class ResponseContext {
    constructor() {
        this._status = 200;
        this._headers = {};
    }

    get status() {
        return this._status;
    }

    set status(code) {
        this._status = code;
    }

    get headers() {
        return this._headers;
    }

    setHeader(name, value) {
        this._headers[name] = value;
        return this;
    }

    json(data, status = 200) {
        this._status = status;
        this._headers['content-type'] = 'application/json';
        return new Response(JSON.stringify(data), {
            status: this._status,
            headers: this._headers,
        });
    }

    text(data, status = 200) {
        this._status = status;
        this._headers['content-type'] = 'text/plain';
        return new Response(data, {
            status: this._status,
            headers: this._headers,
        });
    }

    html(data, status = 200) {
        this._status = status;
        this._headers['content-type'] = 'text/html';
        return new Response(data, {
            status: this._status,
            headers: this._headers,
        });
    }

    send(data, status = 200) {
        this._status = status;

        // Auto-detect content type
        if (typeof data === 'object') {
            return this.json(data, status);
        } else if (typeof data === 'string') {
            if (data.trim().startsWith('<')) {
                return this.html(data, status);
            }
            return this.text(data, status);
        }

        return this.text(String(data), status);
    }
}

module.exports = { RequestContext, ResponseContext };
