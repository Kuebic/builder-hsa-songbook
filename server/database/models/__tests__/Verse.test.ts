import { describe, it, expect } from "vitest";
import { verseSchema } from "../Verse";

describe("Verse Model Schema", () => {
  describe("Schema Structure", () => {
    it("should have all required fields defined", () => {
      const paths = verseSchema.paths;
      
      expect(paths).toHaveProperty("songId");
      expect(paths).toHaveProperty("reference");
      expect(paths).toHaveProperty("text");
      expect(paths).toHaveProperty("submittedBy");
      expect(paths).toHaveProperty("upvotes");
      expect(paths).toHaveProperty("status");
      expect(paths).toHaveProperty("rejectionReason");
    });

    it("should have correct field types", () => {
      const paths = verseSchema.paths;
      
      expect(paths.songId.instance).toBe("ObjectId");
      expect(paths.reference.instance).toBe("String");
      expect(paths.text.instance).toBe("String");
      expect(paths.submittedBy.instance).toBe("ObjectId");
      expect(paths.upvotes.instance).toBe("Array");
      expect(paths.status.instance).toBe("String");
    });

    it("should have required validators on necessary fields", () => {
      const paths = verseSchema.paths;
      
      expect(paths.songId.isRequired).toBe(true);
      expect(paths.reference.isRequired).toBe(true);
      expect(paths.text.isRequired).toBe(true);
      expect(paths.submittedBy.isRequired).toBe(true);
    });

    it("should have correct enum values for status", () => {
      const statusPath = verseSchema.paths.status;
      const enumValues = (statusPath as any).enumValues;
      
      expect(enumValues).toEqual(["pending", "approved", "rejected"]);
    });

    it("should have trim enabled on string fields", () => {
      const referencePath = verseSchema.paths.reference;
      const textPath = verseSchema.paths.text;
      
      expect(referencePath.options.trim).toBe(true);
      expect(textPath.options.trim).toBe(true);
    });

    it("should have correct default values", () => {
      const statusPath = verseSchema.paths.status;
      const upvotesPath = verseSchema.paths.upvotes;
      
      expect((statusPath as any).defaultValue).toBe("pending");
      expect((upvotesPath as any).defaultValue).toBeInstanceOf(Function);
      expect((upvotesPath as any).defaultValue()).toEqual([]);
    });
  });

  describe("Schema Indexes", () => {
    it("should have compound index on songId and status", () => {
      const indexes = verseSchema.indexes();
      const songStatusIndex = indexes.find(
        idx => idx[0].songId === 1 && idx[0].status === 1,
      );
      
      expect(songStatusIndex).toBeDefined();
    });

    it("should have index on submittedBy", () => {
      const indexes = verseSchema.indexes();
      const submittedByIndex = indexes.find(
        idx => idx[0].submittedBy === 1,
      );
      
      expect(submittedByIndex).toBeDefined();
    });

    it("should have index on status", () => {
      const indexes = verseSchema.indexes();
      const statusIndex = indexes.find(
        idx => idx[0].status === 1,
      );
      
      expect(statusIndex).toBeDefined();
    });
  });

  describe("Schema Options", () => {
    it("should have timestamps enabled", () => {
      expect(verseSchema.options.timestamps).toBe(true);
    });
  });

  describe("Virtual Fields", () => {
    it("should have virtuals defined", () => {
      const virtuals = verseSchema.virtuals;
      expect(virtuals).toBeDefined();
      expect(virtuals).toHaveProperty("id");
    });
  });

  describe("Instance Methods", () => {
    it("should have addUpvote method", () => {
      const methods = verseSchema.methods;
      expect(methods).toHaveProperty("addUpvote");
      expect(typeof methods.addUpvote).toBe("function");
    });

    it("should have removeUpvote method", () => {
      const methods = verseSchema.methods;
      expect(methods).toHaveProperty("removeUpvote");
      expect(typeof methods.removeUpvote).toBe("function");
    });

    it("should have getUpvoteCount method", () => {
      const methods = verseSchema.methods;
      expect(methods).toHaveProperty("getUpvoteCount");
      expect(typeof methods.getUpvoteCount).toBe("function");
    });

    it("should have approve method", () => {
      const methods = verseSchema.methods;
      expect(methods).toHaveProperty("approve");
      expect(typeof methods.approve).toBe("function");
    });

    it("should have reject method", () => {
      const methods = verseSchema.methods;
      expect(methods).toHaveProperty("reject");
      expect(typeof methods.reject).toBe("function");
    });
  });

  describe("Static Methods", () => {
    it("should have findBySong static method", () => {
      const statics = verseSchema.statics;
      expect(statics).toHaveProperty("findBySong");
      expect(typeof statics.findBySong).toBe("function");
    });

    it("should have findByUser static method", () => {
      const statics = verseSchema.statics;
      expect(statics).toHaveProperty("findByUser");
      expect(typeof statics.findByUser).toBe("function");
    });

    it("should have findPending static method", () => {
      const statics = verseSchema.statics;
      expect(statics).toHaveProperty("findPending");
      expect(typeof statics.findPending).toBe("function");
    });
  });
});