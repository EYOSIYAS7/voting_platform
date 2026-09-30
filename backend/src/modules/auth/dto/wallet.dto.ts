import { IsString, IsNotEmpty, IsEthereumAddress } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ── Request a SIWE Challenge ──────────────────────────────────────────────────

export class WalletChallengeDto {
  @ApiProperty({
    description: 'EIP-55 checksummed Ethereum wallet address',
    example: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  })
  @IsEthereumAddress()
  walletAddress: string;
}

// ── Verify SIWE Signature ─────────────────────────────────────────────────────

export class WalletVerifyDto {
  @ApiProperty({ description: 'Wallet address that signed the challenge' })
  @IsEthereumAddress()
  walletAddress: string;

  @ApiProperty({ description: 'The nonce/challenge that was signed' })
  @IsString()
  @IsNotEmpty()
  challenge: string;

  @ApiProperty({ description: 'The ECDSA signature over the challenge message' })
  @IsString()
  @IsNotEmpty()
  signature: string;
}
