import { NextResponse } from "next/server";

// Force dynamic rendering - this route should not be statically generated
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const formData = await request.formData();
  const files = formData.getAll("files");

  const uploads = files.map((file, index) => {
    if (!(file instanceof File)) {
      return { name: `unknown-${index}`, status: "skipped" as const };
    }

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      status: "queued" as const,
      location: `/uploads/${file.name}`
    };
  });

  return NextResponse.json({ uploads }, { status: 200 });
}
