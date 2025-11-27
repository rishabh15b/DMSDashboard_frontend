import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function GET() {
  // Check if backend URL is configured
  if (!BACKEND_URL) {
    console.error("NEXT_PUBLIC_API_BASE_URL is not configured");
    return NextResponse.json(
      { 
        error: "Backend API URL not configured. Please set NEXT_PUBLIC_API_BASE_URL environment variable.",
        details: "The frontend cannot connect to the backend API. Please configure the backend URL in Vercel environment variables."
      },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/dashboard/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // Always fetch fresh data
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => `Status ${response.status}`);
      console.error(`Backend API error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { 
          error: "Failed to fetch dashboard insights",
          details: `Backend returned ${response.status}: ${errorText}`,
          backendUrl: BACKEND_URL
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching dashboard insights from backend:", error);
    
    // Provide more specific error messages
    let errorMessage = "Failed to fetch dashboard insights";
    let errorDetails = "Unknown error";
    
    if (error instanceof TypeError && error.message.includes("fetch")) {
      errorMessage = "Cannot connect to backend API";
      errorDetails = `Failed to reach backend at ${BACKEND_URL}. Please verify the backend is deployed and the URL is correct.`;
    } else if (error instanceof Error) {
      errorDetails = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        backendUrl: BACKEND_URL
      },
      { status: 500 }
    );
  }
}
