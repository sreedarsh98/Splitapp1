import React, { useState, useEffect } from "react";
import "./App.css";

const userList = [
  { id: 1, name: "Leanne Graham", password: "12345" },
  { id: 2, name: "Martin Lucas", password: "12345" },
  { id: 3, name: "Jason Bright", password: "12345" },
  { id: 4, name: "Sam Wills", password: "12345" },
  { id: 5, name: "John Lucas", password: "12345" },
];

function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState(userList);
  const [splits, setSplits] = useState(
    JSON.parse(localStorage.getItem("splits")) || []
  );
  const [login, setLogin] = useState({ name: "", password: "" });
  const [tab, setTab] = useState("toPay");
  const [newSplit, setNewSplit] = useState({
    title: "",
    total: 0,
    type: "equal",
    payees: [],
    amounts: {},
  });

  useEffect(() => {
    localStorage.setItem("splits", JSON.stringify(splits));
  }, [splits]);

  const handleLogin = () => {
    const u = users.find(
      (x) => x.name === login.name && x.password === login.password
    );
    if (u) {
      setUser(u);
    } else {
      alert("Invalid credentials");
    }
  };

  const createSplit = () => {
    const split = {
      id: Date.now(),
      title: newSplit.title,
      total: Number(newSplit.total),
      type: newSplit.type,
      creator: user.id,
      payees: newSplit.payees.map((id) => Number(id)),
      amounts: {},
      paid: {},
    };

    if (newSplit.type === "equal") {
      const amount = split.total / split.payees.length;
      split.payees.forEach((id) => (split.amounts[id] = amount));
    } else if (newSplit.type === "amount") {
      split.amounts = newSplit.amounts;
    } else if (newSplit.type === "percent") {
      split.payees.forEach((id) => {
        const percent = newSplit.amounts[id] || 0;
        split.amounts[id] = (percent / 100) * split.total;
      });
    }

    split.payees.forEach((id) => (split.paid[id] = 0));
    setSplits([...splits, split]);
    setNewSplit({ title: "", total: 0, type: "equal", payees: [], amounts: {} });
  };

  const makePayment = (splitId, amount) => {
    const updated = splits.map((s) => {
      if (s.id === splitId) {
        s.paid[user.id] = (s.paid[user.id] || 0) + Number(amount);
      }
      return s;
    });
    setSplits(updated);
  };

  if (!user) {
    return (
      <div>
        <h2>Login</h2>
        <input
          placeholder="Name"
          value={login.name}
          onChange={(e) => setLogin({ ...login, name: e.target.value })}
        />
        <input
          placeholder="Password"
          type="password"
          value={login.password}
          onChange={(e) => setLogin({ ...login, password: e.target.value })}
        />
        <button onClick={handleLogin}>Login</button>
      </div>
    );
  }

  const toPay = splits.filter((s) => s.payees.includes(user.id));
  const toReceive = splits.filter((s) => s.creator === user.id);

  return (
    <div>
      <h2>Welcome {user.name}</h2>
      <button onClick={() => setTab("toPay")}>Splits to Pay</button>
      <button onClick={() => setTab("toReceive")}>Splits to Receive</button>

      {tab === "toPay" && (
        <div>
          <h3>Pending Payments</h3>
          {toPay.map((s) => {
            const due = s.amounts[user.id] - (s.paid[user.id] || 0);
            return (
              <div key={s.id} style={{ marginBottom: 10 }}>
                <strong>{s.title}</strong> | Due: ₹{due.toFixed(2)}
                {due > 0 && (
                  <div>
                    <input
                      type="number"
                      placeholder="Amount"
                      onChange={(e) => (s.temp = e.target.value)}
                    />
                    <button onClick={() => makePayment(s.id, s.temp)}>Pay</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "toReceive" && (
        <div>
          <h3>Splits to Receive</h3>
          {toReceive.map((s) => (
            <div key={s.id} style={{ marginBottom: 10 }}>
              <strong>{s.title}</strong>
              <ul>
                {s.payees.map((pid) => {
                  const person = users.find((u) => u.id === pid);
                  const due = s.amounts[pid] - (s.paid[pid] || 0);
                  return (
                    <li key={pid}>
                      {person.name}: ₹{due.toFixed(2)} due
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 30 }}>
        <h3>Create New Split</h3>
        <input
          placeholder="Title"
          value={newSplit.title}
          onChange={(e) => setNewSplit({ ...newSplit, title: e.target.value })}
        />
        <input
          type="number"
          placeholder="Total Amount"
          value={newSplit.total}
          onChange={(e) => setNewSplit({ ...newSplit, total: e.target.value })}
        />
        <select
          value={newSplit.type}
          onChange={(e) =>
            setNewSplit({ ...newSplit, type: e.target.value, amounts: {} })
          }
        >
          <option value="equal">Equal Split</option>
          <option value="amount">Split by Amount</option>
          <option value="percent">Split by Percentage</option>
        </select>

        <div style={{ marginTop: "20px" }}>
          <label>
            <input
              type="checkbox"
              checked={
                newSplit.payees.length ===
                users.filter((u) => u.id !== user.id).length
              }
              onChange={(e) => {
                if (e.target.checked) {
                  setNewSplit({
                    ...newSplit,
                    payees: users
                      .filter((u) => u.id !== user.id)
                      .map((u) => u.id.toString()),
                  });
                } else {
                  setNewSplit({ ...newSplit, payees: [] });
                }
              }}
            />{" "}
            Select All
          </label>

          <div>
            {users
              .filter((u) => u.id !== user.id)
              .map((u) => (
                <label key={u.id} style={{ display: "block", marginTop: "5px" }}>
                  <input
                    type="checkbox"
                    value={u.id}
                    checked={newSplit.payees.includes(u.id.toString())}
                    onChange={(e) => {
                      const id = e.target.value;
                      const checked = e.target.checked;
                      setNewSplit((prev) => ({
                        ...prev,
                        payees: checked
                          ? [...prev.payees, id]
                          : prev.payees.filter((p) => p !== id),
                      }));
                    }}
                  />{" "}
                  {u.name}
                </label>
              ))}
          </div>
        </div>

        {/* Show individual input or equal share */}
        {newSplit.type !== "equal" &&
          newSplit.payees.map((id) => {
            const person = users.find((u) => u.id === Number(id));
            return (
              <div key={id}>
                {person.name}:
                <input
                  type="number"
                  placeholder={newSplit.type === "amount" ? "Amount" : "%"}
                  onChange={(e) =>
                    setNewSplit((prev) => ({
                      ...prev,
                      amounts: {
                        ...prev.amounts,
                        [id]: Number(e.target.value),
                      },
                    }))
                  }
                />
              </div>
            );
          })}

        {/* Show equal share preview */}
        {newSplit.type === "equal" &&
          newSplit.payees.length > 0 &&
          (() => {
            const amount = newSplit.total / newSplit.payees.length;
            return newSplit.payees.map((id) => {
              const person = users.find((u) => u.id === Number(id));
              return (
                <div key={id}>
                  {person.name}: ₹{isNaN(amount) ? "0.00" : amount.toFixed(2)}
                </div>
              );
            });
          })()}

        <button onClick={createSplit}>Create Split</button>
      </div>
    </div>
  );
}

export default App;
