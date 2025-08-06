import { describe, it, expect } from "vitest";
import { reviewSchema } from "../Review";

describe("Review Model Schema", () => {
  describe("Schema Structure", () => {
    it("should have all required fields defined", () => {
      const paths = reviewSchema.paths;

      expect(paths).toHaveProperty("arrangementId");
      expect(paths).toHaveProperty("userId");
      expect(paths).toHaveProperty("rating");
      expect(paths).toHaveProperty("comment");
      expect(paths).toHaveProperty("helpful");
      expect(paths).toHaveProperty("reported");
      expect(paths).toHaveProperty("reportReason");
    });

    it("should have correct field types", () => {
      const paths = reviewSchema.paths;

      expect(paths.arrangementId.instance).toBe("ObjectId");
      expect(paths.userId.instance).toBe("ObjectId");
      expect(paths.rating.instance).toBe("Number");
      expect(paths.comment.instance).toBe("String");
      expect(paths.helpful.instance).toBe("Array");
      expect(paths.reported.instance).toBe("Boolean");
    });

    it("should have required validators on necessary fields", () => {
      const paths = reviewSchema.paths;

      expect(paths.arrangementId.isRequired).toBe(true);
      expect(paths.userId.isRequired).toBe(true);
      expect(paths.rating.isRequired).toBe(true);
      expect(paths.comment.isRequired).toBe(true);
    });

    it("should have correct validators for rating", () => {
      const ratingPath = reviewSchema.paths.rating;
      const validators = ratingPath.validators;

      // Check for min validator
      const minValidator = validators.find((v) => v.type === "min");
      expect((minValidator as any)?.min).toBe(1);

      // Check for max validator
      const maxValidator = validators.find((v) => v.type === "max");
      expect((maxValidator as any)?.max).toBe(5);
    });

    it("should have correct validators for comment", () => {
      const commentPath = reviewSchema.paths.comment;
      const validators = commentPath.validators;

      // Check for minlength validator
      const minLengthValidator = validators.find((v) => v.type === "minlength");
      expect((minLengthValidator as any)?.minlength).toBe(10);

      // Check for maxlength validator
      const maxLengthValidator = validators.find((v) => v.type === "maxlength");
      expect((maxLengthValidator as any)?.maxlength).toBe(2000);
    });

    it("should have trim enabled on comment field", () => {
      const commentPath = reviewSchema.paths.comment;
      expect(commentPath.options.trim).toBe(true);
    });

    it("should have correct default values", () => {
      const helpfulPath = reviewSchema.paths.helpful;
      const reportedPath = reviewSchema.paths.reported;

      expect((helpfulPath as any).defaultValue).toBeInstanceOf(Function);
      expect((helpfulPath as any).defaultValue()).toEqual([]);
      expect((reportedPath as any).defaultValue).toBe(false);
    });
  });

  describe("Schema Indexes", () => {
    it("should have unique compound index on arrangementId and userId", () => {
      const indexes = reviewSchema.indexes();
      const uniqueIndex = indexes.find(
        (idx) =>
          idx[0].arrangementId === 1 &&
          idx[0].userId === 1 &&
          idx[1]?.unique === true,
      );

      expect(uniqueIndex).toBeDefined();
    });

    it("should have index on reported field", () => {
      const indexes = reviewSchema.indexes();
      const reportedIndex = indexes.find((idx) => idx[0].reported === 1);

      expect(reportedIndex).toBeDefined();
    });

    it("should have index on arrangementId", () => {
      const indexes = reviewSchema.indexes();
      const arrangementIndex = indexes.find(
        (idx) => idx[0].arrangementId === 1 && !idx[0].userId,
      );

      expect(arrangementIndex).toBeDefined();
    });

    it("should have index on userId", () => {
      const indexes = reviewSchema.indexes();
      const userIndex = indexes.find(
        (idx) => idx[0].userId === 1 && !idx[0].arrangementId,
      );

      expect(userIndex).toBeDefined();
    });
  });

  describe("Schema Options", () => {
    it("should have timestamps enabled", () => {
      expect(reviewSchema.options.timestamps).toBe(true);
    });
  });

  describe("Virtual Fields", () => {
    it("should have virtuals defined", () => {
      const virtuals = reviewSchema.virtuals;
      expect(virtuals).toBeDefined();
      expect(virtuals).toHaveProperty("id");
    });
  });

  describe("Instance Methods", () => {
    it("should have markAsHelpful method", () => {
      const methods = reviewSchema.methods;
      expect(methods).toHaveProperty("markAsHelpful");
      expect(typeof methods.markAsHelpful).toBe("function");
    });

    it("should have unmarkAsHelpful method", () => {
      const methods = reviewSchema.methods;
      expect(methods).toHaveProperty("unmarkAsHelpful");
      expect(typeof methods.unmarkAsHelpful).toBe("function");
    });

    it("should have getHelpfulCount method", () => {
      const methods = reviewSchema.methods;
      expect(methods).toHaveProperty("getHelpfulCount");
      expect(typeof methods.getHelpfulCount).toBe("function");
    });

    it("should have report method", () => {
      const methods = reviewSchema.methods;
      expect(methods).toHaveProperty("report");
      expect(typeof methods.report).toBe("function");
    });

    it("should have clearReport method", () => {
      const methods = reviewSchema.methods;
      expect(methods).toHaveProperty("clearReport");
      expect(typeof methods.clearReport).toBe("function");
    });
  });

  describe("Static Methods", () => {
    it("should have findByArrangement static method", () => {
      const statics = reviewSchema.statics;
      expect(statics).toHaveProperty("findByArrangement");
      expect(typeof statics.findByArrangement).toBe("function");
    });

    it("should have findUserReview static method", () => {
      const statics = reviewSchema.statics;
      expect(statics).toHaveProperty("findUserReview");
      expect(typeof statics.findUserReview).toBe("function");
    });

    it("should have getAverageRating static method", () => {
      const statics = reviewSchema.statics;
      expect(statics).toHaveProperty("getAverageRating");
      expect(typeof statics.getAverageRating).toBe("function");
    });

    it("should have findReported static method", () => {
      const statics = reviewSchema.statics;
      expect(statics).toHaveProperty("findReported");
      expect(typeof statics.findReported).toBe("function");
    });
  });
});
