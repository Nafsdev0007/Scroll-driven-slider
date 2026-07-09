"use client";
import Navbar from "@/components/Navbar/Navbar";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import { useRef, useState } from "react";
import { slides } from "@/data";

gsap.registerPlugin(ScrollTrigger, SplitText);

const Home = () => {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const sliderTitleRef = useRef<HTMLDivElement>(null);
  const sliderIndicesRef = useRef<HTMLDivElement>(null);

  // vanilla DOM createElement/innerHTML এর বদলে এখন state-ই source of truth
  const [activeIndex, setActiveIndex] = useState(0);
  // প্রতিটা "নতুন appendChild" এর জন্য একটা unique instance id দরকার,
  // যাতে একই slide index-এ ফিরে গেলেও নতুন DOM node তৈরি হয় ও সবার উপরে বসে
  const instanceIdRef = useRef(0);
  const [visibleSlides, setVisibleSlides] = useState<
    { id: number; index: number }[]
  >([{ id: 0, index: 0 }]);

  const imageRefs = useRef<Map<number, HTMLImageElement>>(new Map());
  const currentSplit = useRef<InstanceType<typeof SplitText> | null>(null);

  // ScrollTrigger + progress bar — এইটুকু আগের মতোই, শুধু DOM বানানোর জায়গায় state আপডেট করছি
  useGSAP(() => {
    const pinDistance = window.innerHeight * slides.length;
    let activeSlide = 0;

    ScrollTrigger.create({
      trigger: ".slider",
      start: "top top",
      end: `+=${pinDistance}px`,
      scrub: 1,
      pin: true,
      pinSpacing: true,
      onUpdate: (self) => {
        gsap.set(progressBarRef.current, { scaleY: self.progress });

        const currentSlide = Math.floor(self.progress * slides.length);

        if (activeSlide !== currentSlide && currentSlide < slides.length) {
          activeSlide = currentSlide;
          setActiveIndex(currentSlide);
          setVisibleSlides((prev) => {
            instanceIdRef.current += 1;
            const next = [...prev, { id: instanceIdRef.current, index: currentSlide }];
            return next.slice(-3); // আগের মতোই সবসময় সর্বোচ্চ 3টা image DOM-এ রাখা
          });
        }
      },
    });
  }, []);

  // নতুন slide image render হওয়ার পর fade+scale animation (আগের animateNewSlide এর image অংশ)
  useGSAP(() => {
    const latest = visibleSlides[visibleSlides.length - 1];
    if (!latest) return;
    const node = imageRefs.current.get(latest.id);
    if (!node) return;

    gsap.fromTo(
      node,
      { opacity: 0, scale: 1.1 },
      { opacity: 1, scale: 1, duration: 1, ease: "power2.out" }
    );
  }, [visibleSlides]);

  // Indicators animation (আগের animateIndicators)
  useGSAP(() => {
    const indicators = sliderIndicesRef.current?.querySelectorAll("p");
    indicators?.forEach((indicator, i) => {
      const marker = indicator.querySelector(".marker");
      const indexEl = indicator.querySelector(".index");

      gsap.to(indexEl, {
        opacity: i === activeIndex ? 1 : 0.5,
        duration: 0.3,
        ease: "power2.out",
      });

      gsap.to(marker, {
        scaleX: i === activeIndex ? 1 : 0,
        duration: 0.3,
        ease: "power2.out",
      });
    });
  }, [activeIndex]);

  // Title animation (আগের animateNewTitle)
  useGSAP(() => {
    if (currentSplit.current) {
      currentSplit.current.revert();
    }

    const titleEl = sliderTitleRef.current?.querySelector("h1");
    if (!titleEl) return;

    currentSplit.current = new SplitText(titleEl, {
      type: "lines",
      linesClass: "line",
      mask: "lines",
    });

    gsap.set(currentSplit.current.lines, {
      yPercent: 100,
      opacity: 0,
    });

    gsap.to(currentSplit.current.lines, {
      yPercent: 0,
      opacity: 1,
      duration: 0.75,
      stagger: 0.1,
      ease: "power3.out",
    });
  }, [activeIndex]);

  return (
    <div className="">
      <Navbar />

      <section className="intro">
        <h1>
          Scroll to explore the rhythm of still images that move quietly
          between story and sensation.
        </h1>
      </section>

      <section className="slider overflow-x-hidden">
        <div className="slider-images">
          {visibleSlides.map((slide) => (
            <Image
              key={slide.id}
              ref={(el) => {
                if (el) imageRefs.current.set(slide.id, el);
                else imageRefs.current.delete(slide.id);
              }}
              src={slides[slide.index].image}
              alt={`Slide ${slide.index + 1}`}
              width={10000}
              height={10000}
            />
          ))}
        </div>

        <div ref={sliderTitleRef} className="slider-title">
          <h1>{slides[activeIndex].title}</h1>
        </div>

        <div className="slider-indicator">
          <div ref={sliderIndicesRef} className="slider-indices">
            {slides.map((_, index) => (
              <p key={index} data-index={index}>
                <span
                  className="marker"
                  style={{ transform: index === 0 ? "scaleX(1)" : "scaleX(0)" }}
                />
                <span
                  className="index"
                  style={{ opacity: index === 0 ? 1 : 0.35 }}
                >
                  {(index + 1).toString().padStart(2, "0")}
                </span>
              </p>
            ))}
          </div>

          <div className="slider-progress-bar">
            <div ref={progressBarRef} className="slider-progress"></div>
          </div>
        </div>
      </section>

      <section className="outro">
        <h1>
          As the sequence slows the silence takes over, holding the last
          traces of motion in the air.
        </h1>
      </section>
    </div>
  );
};

export default Home;