import React from 'react';
import DiagramApp from '../diagram/index';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Diagrams() {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] min-h-[100svh] bg-neutral-950 text-neutral-100">
      <Navbar variant="transparent" />
      <section className="relative overflow-hidden">
        <DiagramApp />
      </section>
      <Footer />
    </div>
  );
}