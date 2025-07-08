import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Bardzo proste połączenie
    await mongoose.connect("mongodb://localhost:27017/csvreader");

    // Test prostego zapisu
    const TestSchema = new mongoose.Schema({
      message: String,
      date: { type: Date, default: Date.now },
    });

    const Test = mongoose.models.Test || mongoose.model("Test", TestSchema);

    const testDoc = new Test({ message: "Hello MongoDB!" });
    await testDoc.save();

    const count = await Test.countDocuments();

    return NextResponse.json({
      success: true,
      message: "MongoDB działa!",
      testDocuments: count,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
