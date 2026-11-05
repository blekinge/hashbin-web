import { isAuthenticated, login, register } from "../lib/auth.js";
import { h, mount } from "../lib/dom.js";
import { mountLayout } from "../lib/layout.js";

let isLogin = true;

const email = h("input", { id: "email", type: "email", required: true, autocomplete: "username" });
const password = h("input", { id: "password", type: "password", required: true, minlength: 8, autocomplete: "current-password" });
const errorHost = h("p", { class: "err" }, "");
const submit = h("button", { class: "btn", type: "submit" }, "Sign in");
const toggle = h("button", { class: "linkbtn", type: "button" }, "Sign up");
const title = h("h1", {}, "Sign in");
const subtitle = h("p", { class: "lede" }, "Sign in to keep a history of your timestamps.");

function applyMode(): void {
  errorHost.textContent = "";
  title.textContent = isLogin ? "Sign in" : "Create account";
  subtitle.textContent = isLogin
    ? "Sign in to keep a history of your timestamps."
    : "Create an account to track your timestamps.";
  submit.textContent = isLogin ? "Sign in" : "Sign up";
  toggle.textContent = isLogin ? "Sign up" : "Sign in";
  password.setAttribute("autocomplete", isLogin ? "current-password" : "new-password");
}

async function onSubmit(e: Event): Promise<void> {
  e.preventDefault();
  submit.setAttribute("disabled", "");
  errorHost.textContent = "";
  try {
    if (isLogin) await login(email.value, password.value);
    else await register(email.value, password.value);
    location.replace("my.html");
  } catch (err) {
    errorHost.textContent = (err as Error).message;
    submit.removeAttribute("disabled");
  }
}

toggle.addEventListener("click", () => {
  isLogin = !isLogin;
  applyMode();
});

mountLayout("auth");

if (isAuthenticated()) {
  location.replace("my.html");
} else {
  mount(
    h(
      "div",
      { class: "page narrow" },
      title,
      subtitle,
      h(
        "form",
        { class: "space", onsubmit: (e: Event) => void onSubmit(e) },
        h("div", { class: "field" }, h("label", { for: "email" }, "Email"), email),
        h("div", { class: "field" }, h("label", { for: "password" }, "Password"), password),
        submit,
        errorHost,
      ),
      h("p", { class: "muted" }, isLogin ? "Don't have an account? " : "Already have an account? ", toggle),
    ),
  );
  applyMode();
}
