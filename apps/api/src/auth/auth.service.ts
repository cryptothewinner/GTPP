import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeUserRole, type UserRole } from '@sepenatural/shared';

export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    fullName: string;
}

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, password: string) {
        console.log(`[AuthService] Validating user: ${email}`);
        const user = await this.prisma.user.findUnique({ where: { email } });

        if (!user) {
            console.log(`[AuthService] User not found: ${email}`);
            throw new UnauthorizedException('Geçersiz kimlik bilgileri');
        }

        if (!user.isActive) {
            console.log(`[AuthService] User is inactive: ${email}`);
            throw new UnauthorizedException('Geçersiz kimlik bilgileri');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            console.log(`[AuthService] Invalid password for: ${email}`);
            throw new UnauthorizedException('Geçersiz kimlik bilgileri');
        }

        console.log(`[AuthService] User validated successfully: ${email}`);
        return user;
    }

    async login(email: string, password: string) {
        const user = await this.validateUser(email, password);
        const normalizedRole = normalizeUserRole(user.role);

        if (!normalizedRole) {
            throw new UnauthorizedException('Kullanıcı rolü doğrulanamadı');
        }

        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            role: normalizedRole,
            fullName: user.fullName,
        };

        return {
            accessToken: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: normalizedRole,
            },
        };
    }
}
