import Big from 'big.js'

export class Token {
    private amount: Big
    private constructor(amount: Big) {
        this.amount = amount
    }

    plusToken(token: Token): Token {
        return new Token(this.amount.plus(token.amount))
    }

    minusToken(token: Token): Token {
        return new Token(this.amount.minus(token.amount))
    }

    static fromNumber(number: number): Token {
        return new Token(Big(number).mul(Big(10).pow(16)))
    }

    static fromString(string: string): Token {
        return new Token(Big(string))
    }

    toString(): string {
        return this.amount.toString()
    }
}
