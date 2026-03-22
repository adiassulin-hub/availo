const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    name: { type: String, required: true },
    category: { type: String, required: true },
    city: { type: String, required: true },
    status: {
  type: String,
  enum: ["pending", "approved", "rejected", "blocked"],
  default: "pending"
},

reports: [
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: {
      type: String,
      enum: ["spam", "fake", "inappropriate", "duplicate", "other"],
      default: "other"
    },
    message: { type: String, maxlength: 500 },
    createdAt: { type: Date, default: Date.now }
  }
],

reportsCount: { type: Number, default: 0 },

   
    description: String,
    address: String,
    phone: String,
    instagram: String,
    images: [String],
    reviews: [
          {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    text: { type: String, maxlength: 500 },
    createdAt: { type: Date, default: Date.now }
    }
    ],
     avgRating: { type: Number, default: 0 },
     reviewsCount: { type: Number, default: 0 },


    geo: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
  },
  { timestamps: true }
);

businessSchema.index({ geo: "2dsphere" });

module.exports = mongoose.model("Business", businessSchema);
