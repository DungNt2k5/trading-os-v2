import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
 
interface Ctx { params: Promise<{ id: string; accountId: string }> }
 
export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id, accountId } = await params;
  const body = await req.json();
 
  // allow patching: deposit, volume, depositTime, note, uid, wallet, email, crossedBonus
  const data: Record<string, unknown> = {};
  if (body.email       !== undefined) data.email       = body.email;
  if (body.uid         !== undefined) data.uid         = body.uid;
  if (body.wallet      !== undefined) data.wallet      = body.wallet;
  if (body.deposit     !== undefined) data.deposit     = body.deposit;
  if (body.volume      !== undefined) data.volume      = body.volume;
  if (body.note        !== undefined) data.note        = body.note;
  if (body.crossedBonus !== undefined) data.crossedBonus = body.crossedBonus;
  if ("depositTime" in body) data.depositTime = body.depositTime ? new Date(body.depositTime) : null;
 
  const account = await prisma.campaignAccount.update({
    where: { id: accountId, campaignId: id },
    data,
  });
  return NextResponse.json(account);
}
 
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id, accountId } = await params;
  await prisma.campaignAccount.delete({ where: { id: accountId, campaignId: id } });
  return NextResponse.json({ ok: true });
}