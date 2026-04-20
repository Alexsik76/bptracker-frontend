export class AuthManager {
    constructor(apiClient) {
        this.api = apiClient;
        this.user = null;
    }

    async init() {
        this.user = await this.api.checkMe();
        return this.user;
    }

    async register(email) {
        try {
            const options = await this.api.registerPasskeyBegin(email);
            
            // Transform options for WebAuthn API
            options.challenge = this._base64ToArrayBuffer(options.challenge);
            options.user.id = this._base64ToArrayBuffer(options.user.id);
            if (options.excludeCredentials) {
                options.excludeCredentials.forEach(c => c.id = this._base64ToArrayBuffer(c.id));
            }

            const credential = await navigator.credentials.create({ publicKey: options });
            
            // Transform credential for API
            const attestationResponse = {
                id: credential.id,
                rawId: this._arrayBufferToBase64(credential.rawId),
                type: credential.type,
                extensions: credential.getClientExtensionResults(),
                response: {
                    attestationObject: this._arrayBufferToBase64(credential.response.attestationObject),
                    clientDataJSON: this._arrayBufferToBase64(credential.response.clientDataJSON),
                    transports: credential.response.getTransports ? credential.response.getTransports() : []
                }
            };

            const result = await this.api.registerPasskeyComplete(attestationResponse);
            this.user = { email }; // Success
            return result;
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    }

    async login() {
        try {
            const options = await this.api.loginPasskeyBegin();
            
            // Transform options for WebAuthn API
            options.challenge = this._base64ToArrayBuffer(options.challenge);
            if (options.allowCredentials) {
                options.allowCredentials.forEach(c => c.id = this._base64ToArrayBuffer(c.id));
            }

            const assertion = await navigator.credentials.get({ publicKey: options });
            
            // Transform assertion for API
            const assertionResponse = {
                id: assertion.id,
                rawId: this._arrayBufferToBase64(assertion.rawId),
                type: assertion.type,
                extensions: assertion.getClientExtensionResults(),
                response: {
                    authenticatorData: this._arrayBufferToBase64(assertion.response.authenticatorData),
                    clientDataJSON: this._arrayBufferToBase64(assertion.response.clientDataJSON),
                    signature: this._arrayBufferToBase64(assertion.response.signature),
                    userHandle: assertion.response.userHandle ? this._arrayBufferToBase64(assertion.response.userHandle) : null
                }
            };

            const result = await this.api.loginPasskeyComplete(assertionResponse);
            this.user = await this.api.checkMe();
            return result;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    async requestMagicLink(email) {
        return await this.api.requestMagicLink(email);
    }

    async logout() {
        await this.api.logout();
        this.user = null;
        window.location.reload();
    }

    _base64ToArrayBuffer(base64) {
        const binaryString = window.atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    _arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }
}
