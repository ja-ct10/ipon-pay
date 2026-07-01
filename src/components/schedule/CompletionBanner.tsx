import { motion } from 'framer-motion'

export function CompletionBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      role="status"
      aria-live="polite"
      className="bg-warm-gold/20 border border-warm-gold text-warm-gold rounded-xl p-4 text-center font-semibold"
    >
      This Paluwagan round is complete! All members have received the pool.
    </motion.div>
  )
}
