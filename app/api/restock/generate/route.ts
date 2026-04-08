import { generateRecommendations } from "@/lib/restock-engine"
import { createClient } from "@/lib/utils/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Generate recommendations
    const recommendations = await generateRecommendations(cookieStore)

    return NextResponse.json({
      success: true,
      count: recommendations.length,
      recommendations,
    })
  } catch (error) {
    console.error("[inventory] Error generating recommendations:", error)
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}
