import { describe, it, expect } from "vitest";
import { parseSRTSubtitles, millisecondsToTime } from "./phrase-extractor";

describe("Phrase Extractor", () => {
  describe("parseSRTSubtitles", () => {
    it("should parse valid SRT content", () => {
      const srtContent = `1
00:00:01,000 --> 00:00:03,000
First subtitle

2
00:00:04,000 --> 00:00:06,000
Second subtitle`;

      const result = parseSRTSubtitles(srtContent);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        sequenceNumber: 1,
        startTime: 1000,
        endTime: 3000,
        text: "First subtitle",
      });
      expect(result[1]).toEqual({
        sequenceNumber: 2,
        startTime: 4000,
        endTime: 6000,
        text: "Second subtitle",
      });
    });

    it("should handle multiline subtitle text", () => {
      const srtContent = `1
00:00:01,000 --> 00:00:03,000
First line
Second line`;

      const result = parseSRTSubtitles(srtContent);

      expect(result).toHaveLength(1);
      expect(result[0]?.text).toBe("First line\nSecond line");
    });

    it("should skip invalid blocks", () => {
      const srtContent = `1
00:00:01,000 --> 00:00:03,000
Valid subtitle

Invalid block without timing

2
00:00:04,000 --> 00:00:06,000
Another valid subtitle`;

      const result = parseSRTSubtitles(srtContent);

      expect(result).toHaveLength(2);
      expect(result[0]?.text).toBe("Valid subtitle");
      expect(result[1]?.text).toBe("Another valid subtitle");
    });

    it("should handle empty subtitles", () => {
      const srtContent = "";
      const result = parseSRTSubtitles(srtContent);
      expect(result).toHaveLength(0);
    });

    it("should correctly convert time to milliseconds", () => {
      const srtContent = `1
00:00:00,000 --> 00:00:01,500
Test

2
01:30:45,123 --> 01:30:50,999
Test 2`;

      const result = parseSRTSubtitles(srtContent);

      // First subtitle: 0ms to 1500ms
      expect(result[0]?.startTime).toBe(0);
      expect(result[0]?.endTime).toBe(1500);

      // Second subtitle: 1h 30m 45s 123ms to 1h 30m 50s 999ms
      expect(result[1]?.startTime).toBe(5445123);
      expect(result[1]?.endTime).toBe(5450999);
    });
  });

  describe("millisecondsToTime", () => {
    it("should convert milliseconds to SRT time format", () => {
      expect(millisecondsToTime(0)).toBe("00:00:00,000");
      expect(millisecondsToTime(1000)).toBe("00:00:01,000");
      expect(millisecondsToTime(1500)).toBe("00:00:01,500");
      expect(millisecondsToTime(60000)).toBe("00:01:00,000");
      expect(millisecondsToTime(3600000)).toBe("01:00:00,000");
      expect(millisecondsToTime(5445123)).toBe("01:30:45,123");
    });

    it("should handle large millisecond values", () => {
      const time = 7384567; // ~2 hours
      const result = millisecondsToTime(time);
      expect(result).toMatch(/^\d{2}:\d{2}:\d{2},\d{3}$/);
    });
  });
});
