const Footer = () => {
  return (
    <footer className="bg-[hsl(var(--header-bg))] py-6 px-6 mt-auto">
      <div className="max-w-7xl mx-auto text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-lg font-semibold text-foreground">
            SkillShare<span className="text-sm align-top">Campus</span>
          </span>
        </div>
        <p className="text-sm text-foreground/80">
          © 2025 SkillShareCampus. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
