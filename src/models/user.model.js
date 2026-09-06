const mongoose = require("mongoose");

const userSchema = new mongoose.Schema ({
    username: {
        type:String,
        unique: [true, "username already exists"],
        required: true,
    },

    email : {
        type: String,
        unique: [true, "account is already exists with address"],
        required: true,
    },

    password: {
        type: String,
        required: true,
    }
});

const User = mongoose.model("User", userSchema);

module.exports = User;