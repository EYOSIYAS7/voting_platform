var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsString, IsNotEmpty, IsEthereumAddress } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class WalletChallengeDto {
    walletAddress;
}
__decorate([
    ApiProperty({
        description: 'EIP-55 checksummed Ethereum wallet address',
        example: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    }),
    IsEthereumAddress(),
    __metadata("design:type", String)
], WalletChallengeDto.prototype, "walletAddress", void 0);
export class WalletVerifyDto {
    walletAddress;
    challenge;
    signature;
}
__decorate([
    ApiProperty({ description: 'Wallet address that signed the challenge' }),
    IsEthereumAddress(),
    __metadata("design:type", String)
], WalletVerifyDto.prototype, "walletAddress", void 0);
__decorate([
    ApiProperty({ description: 'The nonce/challenge that was signed' }),
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], WalletVerifyDto.prototype, "challenge", void 0);
__decorate([
    ApiProperty({ description: 'The ECDSA signature over the challenge message' }),
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], WalletVerifyDto.prototype, "signature", void 0);
//# sourceMappingURL=wallet.dto.js.map