import { NextResponse } from "next/server";

// Force dynamic rendering - this route should not be statically generated
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

interface Params {
  params: { id: string };
}

export async function GET(_: Request, { params }: Params) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/documents/${params.id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ message: "Document not found" }, { status: 404 });
      }
      throw new Error(`Backend API returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching document from backend:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/documents/${params.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ message: "Document not found" }, { status: 404 });
      }
      throw new Error(`Backend API returned ${response.status}`);
    }

    return NextResponse.json({ message: "Document deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const payload = await request.json();
    const response = await fetch(`${BACKEND_URL}/api/documents/${params.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      cache: "no-store",
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ message: "Document not found" }, { status: 404 });
      }
      throw new Error(`Backend API returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}
