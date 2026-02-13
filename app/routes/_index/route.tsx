import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

import { login } from "../../shopify.server";

import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Advertorial</h1>
        <p className={styles.text}>
          Generate high-converting advertorial pages for your Shopify products in seconds.
        </p>
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Shop domain</span>
              <input className={styles.input} type="text" name="shop" />
              <span>e.g: my-shop-domain.myshopify.com</span>
            </label>
            <button className={styles.button} type="submit">
              Log in
            </button>
          </Form>
        )}
        <ul className={styles.list}>
          <li>
            <strong>One-click page generation</strong>. Choose a product, pick a
            template and angle, and get a publish-ready advertorial page instantly.
          </li>
          <li>
            <strong>Native Shopify pages</strong>. Published pages use your
            store's theme with full header, footer, and styles — no external hosting.
          </li>
          <li>
            <strong>Built for ads</strong>. Grab the live URL and drop it into
            your Meta, TikTok, or Google ad campaigns.
          </li>
        </ul>
      </div>
    </div>
  );
}
