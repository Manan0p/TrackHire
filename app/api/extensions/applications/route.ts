import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Source } from "@prisma/client";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401, headers: corsHeaders });
    }

    const apiKey = authHeader.split(" ")[1];
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 401, headers: corsHeaders });
    }

    const user = await prisma.user.findUnique({
      where: { apiKey },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid API Key" }, { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { company, role, jobUrl, source } = body;

    if (!company || !role) {
      return NextResponse.json({ error: "Company and Role are required" }, { status: 400, headers: corsHeaders });
    }

    let parsedSource: Source = Source.OTHER;
    if (Object.values(Source).includes(source as Source)) {
      parsedSource = source as Source;
    } else if (jobUrl?.includes("linkedin.com")) {
      parsedSource = Source.LINKEDIN;
    } else if (jobUrl?.includes("wellfound.com") || jobUrl?.includes("angel.co")) {
      parsedSource = Source.WELLFOUND;
    }

    const newApp = await prisma.application.create({
      data: {
        userId: user.id,
        company,
        role,
        jobUrl,
        source: parsedSource,
        status: "APPLIED",
        appliedAt: new Date(),
        statusHistory: {
          create: {
            toStatus: "APPLIED",
          },
        },
      },
    });

    return NextResponse.json({ success: true, application: newApp }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error("Extension API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: corsHeaders });
  }
}
