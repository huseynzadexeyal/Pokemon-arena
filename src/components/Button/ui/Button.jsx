import styles from "../styles/Button.module.css";

// variant: "danger" (qırmızı-narıncı) | "success" (yaşıl, əsas CTA)
// Qalan bütün props (disabled, autoFocus, aria-*) birbaşa <button>-a ötürülür
export default function Button({ children, onClick, variant = "danger", ...rest }) {
  return (
    <button
      type="button"
      className={`${styles.btn} ${styles[variant]}`}
      onClick={onClick}
      {...rest}
    >
      <span className={styles.label}>{children}</span>
    </button>
  );
}
