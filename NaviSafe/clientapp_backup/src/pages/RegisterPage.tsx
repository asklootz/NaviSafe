import React, { useState } from "react";

export function RegisterPage() {
    const [form, setForm] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        fullName: "",
        phoneNumber: "",
        streetAddress: "",
        city: "",
        postalCode: "",
        country: "",
    });

    async function handleRegister(e) {
        e.preventDefault();
        try {
            const response = await fetch("/api/account/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (!response.ok) throw new Error("Registration failed");
            alert("Account created successfully!");
        } catch (err) {
            alert(err.message);
        }
    }

    return (
        <div style={{ maxWidth: 400, margin: "50px auto" }}>
            <h2>Register</h2>
            <form onSubmit={handleRegister}>
                <input
                    type="text"
                    placeholder="Full name"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    required
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                />
                <input
                    type="password"
                    placeholder="Confirm password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    required
                />
                <input
                    type="text"
                    placeholder="Phone number"
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    required
                />
                <input
                    type="text"
                    placeholder="Street address"
                    value={form.streetAddress}
                    onChange={(e) => setForm({ ...form, streetAddress: e.target.value })}
                    required
                />
                <input
                    type="text"
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    required
                />
                <input
                    type="text"
                    placeholder="Postal code"
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    required
                />
                <input
                    type="text"
                    placeholder="Country"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    required
                />
                <button type="submit">Register</button>
            </form>
        </div>
    );
}
