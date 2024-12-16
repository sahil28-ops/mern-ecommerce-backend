const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const slugify = require("slugify");
const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3001;
mongoose
  .connect("mongodb://localhost:27017/ecommerce")
  .then(async () => {
    console.log("connected to mongo db");
  })
  .catch((err) => {
    console.log("Fail to connect mongodb", err);
  });
// user schema/model start
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true },
    mobile: { type: Number, required: true, trim: true },
    password: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    role: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
// user schema/model end

// category schema/model start
const categorySchema = new mongoose.Schema(
  {
    name: { type: String },
    slug: {
      type: String,
      lowercase: true,
    },
  },
  { timestamps: true }
);

const categoryModel = mongoose.model("Category", categorySchema);
// category schema/model end

// Product schema/model start
const productSchema = new mongoose.Schema(
  {
    name: { type: String },
    description: { type: String },
    price: { type: Number },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
  },
  { timestamps: true }
);
const productModel = mongoose.model("Product", productSchema);
// Product schema/model end
app.post("/register", async (req, res) => {
  const { name, email, password, address, mobile } = req.body;
  try {
    if (name === "") {
      return res.status(200).send({ message: "Name field is  required" });
    } else if (email === "") {
      return res.status(200).send({ message: "Email field is required" });
    } else if (password === "") {
      return res.status(200).send({ message: "Password field is required" });
    } else if (address === "") {
      return res.status(200).send({ message: "Adress field is required" });
    } else if (mobile === "") {
      return res.status(200).send({ message: "Mobile field is required" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send({
        success: false,
        Message: "User already existed",
      });
    }
    const newUser = await new User({
      name,
      email,
      password,
      address,
      mobile,
    }).save();
    res
      .status(201)
      .json({ success: true, Message: "User Created Sucessfully", newUser });
  } catch (error) {
    res.status(500).json({ sucess: false, message: error.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email === "") {
      return res.status(200).send("email is required");
    } else if (password === "") {
      return res.status(200).send("password is required");
    } else if (!email || !password) {
      res.status(200).send("email and password not found");
    }
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(200).send({
        Message: "User not registered",
      });
    }
    const check = password === existingUser.password;
    if (!check) {
      return res
        .status(200)
        .send({ sucess: false, message: "password is invalid" });
    }
    res.status(200).json({
      success: true,
      message: "login successful",
      user: {
        name: existingUser.name,
        mobile: existingUser.mobile,
        email: existingUser.email,
        address: existingUser.address,
        role: existingUser.role,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "error while login" });
  }
});

app.post("/category", async (req, res) => {
  try {
    const { category: name } = req.body;
    if (!name) {
      return res.status(200).json({
        success: false,
        message: "Category name is required",
      });
    }

    const existingCategory = await categoryModel.findOne({ name });
    if (existingCategory) {
      return res.status(200).json({
        success: true,
        message: "Category already exists",
      });
    }

    const newCategory = await new categoryModel({
      name,
      slug: slugify(name),
    }).save();

    res.status(201).json({
      success: true,
      message: "Category added successfully",
      newCategory,
    });
  } catch (error) {
    console.error("Error while adding category:", error.message);
    res.status(500).json({
      success: false,
      message: "Error while adding category",
    });
  }
});

app.post("/product", async (req, res) => {
  try {
    const product = await new productModel(req.body).save();
    if (!product) {
      return res.status(200).json({
        success: false,
        message: "Product not found",
      });
    }
    res.status(201).json({ success: true, product, message: "successfull" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "error while add product" });
  }
});

app.get("/category/:id", async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await categoryModel.findById(categoryId);
    if (!category) {
      return res.status(200).json({ error: "catagory not found" });
    }
    // const products = await productModel.find({ categoryId: categoryId });
    res.status(200).json({
      success: true,
      message: "found category",
      category,
      // category: {
      //   // categoryName: category.categoryname,
      // },
      // products: products.map((product) => ({
      //   name: product.name,
      //   description: product.description,
      //   price: product.price,
      // })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/categories", async (req, res) => {
  try {
    const categories = await categoryModel.find();
    if (!categories) {
      return res.status(200).json({
        success: false,
        message: "Category not found",
      });
    }
    return res.status(201).json({
      success: true,
      message: "Category fetch successfull",
      categories,
    });
  } catch (error) {
    console.error("Error while adding category:", error.message);
    res.status(500).json({
      success: false,
      message: "Error while adding category",
    });
  }
});
app.listen(PORT, () => console.log(`Server running on Port :${PORT}`));
