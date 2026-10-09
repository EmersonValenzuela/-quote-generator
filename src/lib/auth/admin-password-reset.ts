import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import type { PrismaClient } from "@/generated/prisma/client";

export async function resetAdministratorPassword(
  prisma: PrismaClient,
  userId: string,
  newPassword: string,
  requestId: string,
): Promise<void> {
  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction(async (transaction) => {
    const administrator = await transaction.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!administrator || administrator.role !== "admin") {
      throw new Error("El usuario ya no es un administrador; no se modificó la cuenta.");
    }

    const credentialAccount = await transaction.account.findFirst({
      where: { userId: administrator.id, providerId: "credential" },
      select: { id: true },
    });

    if (credentialAccount) {
      await transaction.account.update({
        where: { id: credentialAccount.id },
        data: { password: passwordHash },
      });
    } else {
      await transaction.account.create({
        data: {
          id: randomUUID(),
          accountId: administrator.id,
          providerId: "credential",
          userId: administrator.id,
          password: passwordHash,
        },
      });
    }

    await transaction.user.update({
      where: { id: administrator.id },
      data: { mustChangePassword: true },
    });
    await transaction.session.deleteMany({ where: { userId: administrator.id } });
    await transaction.auditEvent.create({
      data: {
        action: "auth.admin_password_reset",
        entityType: "user",
        entityId: administrator.id,
        requestId,
      },
    });
  });
}
