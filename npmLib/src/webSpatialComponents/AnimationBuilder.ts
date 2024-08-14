export enum ModelAnimateOpacityEaseFn {
    easeInOut = 'easeInOut'
}

export class AnimationBuilder {
    private _fadeOut = false
    private _fadeDuration = 1;

    fadeOut(v: boolean) {
        this._fadeOut = v;
        return this
    }

    fadeDuration(v: number) {
        this._fadeDuration = v;
        return this
    }

    build() {
        return {
            fadeOut: this._fadeOut,
            fadeDuration: this._fadeDuration
        }
    }
}