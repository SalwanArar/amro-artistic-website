import './Hero.css';
import logo from '../../../../assets/images/Logo.png';

export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <img src={logo} alt="Hero" style={{ width: '112px', height: '112px' }} className="hero__image" />
    </section>
  )
}
