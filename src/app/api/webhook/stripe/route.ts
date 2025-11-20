import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "~/server/db";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ msg: "Missing stripe-signature header" }, { status: 400 });
  }  

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Signature error:", err);
    return NextResponse.json({ msg: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    console.log("updating user credits");

    const session = event.data.object as Stripe.Checkout.Session;

    const credits = Number(session.metadata?.credits);
    const userId = Number(session.client_reference_id);

    if (!credits || !userId)
      return NextResponse.json(
        { msg: "Missing userId or credits" },
        { status: 404 }
      );

    await db.stripeTransaction.create({
      data: { credits, userId },
    });

    await db.user.update({
      where: { id: userId },
      data: { credits: { increment: credits } },
    });

    return NextResponse.json({ msg: "Credits added successfully" });
  }

  return NextResponse.json({ msg: "OK" });
}
