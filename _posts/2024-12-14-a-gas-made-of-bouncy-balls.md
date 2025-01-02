---
layout: post
title:  "A Gas Made of Bouncy Balls"
date:   2025-1-2 00:00:00 -0600
categories: physics
mathjax: true
---

Lately, I've been reminiscing about the physics simulations I used to make back
in the day. A lot of them were kind of crude, but I'm older and hopefully a bit
wiser now, so hopefully I can do it a bit better this time around. Revisiting my
old nerdy projects take me back to when I was first grappling with a lot of
ideas that would come up over and over again in my education — I've heard it
said that studying physics is learning a series of progressively smaller lies,
and true to form by the time I finished my undergrad physics major I'd studied
the same sorts of systems a bunch of times in progressively greater detail and
with progressively fancier math. One such system is a gas in a box.

My first encounter with a model of gas in a box was the kinetic theory of gases
and ideal gas law in high school chemistry. The model is remarkably simple:
imagine a gas as a bunch of molecules all bouncing around the inside of a
container. For simplicity, model each molecule as a ball, and make it so that
the balls don't slow down when they bounce (more precisely, collisions are
perfectly elastic). Furthermore, assume that the molecules all start out moving
in uniformly random directions. Lastly, assume that the molecules are small and
sparse enough that we can ignore their collisions. This model was used to
qualitatively explain the behaviors of gases in my high school chemistry class;
the more quantitative analysis I'll be presenting here is based off of one from
my college statistical mechanics class. But first off, here's a nice visual
simulation of this model to give some intuition for what I'm talking about. By
the way, all the visuals in this post are running live in your browser! All of
them can be reset by clicking on them if you would like to re-randomize or start
them from the beginning.

<!-- Add utility to pause animations while they are offscreen -->
<script src="{{site.url}}/utils/pause_iframes.js"></script>

<iframe src="{{site.url}}/gas/non_interacting_gas.html" width=400 height=400></iframe>

<!-- Despite the fact that all of these assumptions are at least a little bit wrong,
they turn out to give a very accurate picture of how "common" gases behave under
"common" conditions. For example, nitrogen and oxygen, which make up about 99%
of the air on earth, come as bonded pairs of atoms, so they look more like
barbells than spheres. Even treating a single-atom gas like helium as a ball
sweeps some details under the rug. Also, even in sparse gases, some collisions
between molecules still happen, so ignoring them completes also causes the model
to diverge from reality. Even so, this model turns out to be sufficient to
derive the ideal gas law. -->

# The ideal gas law?

I'm going to gloss over the historical detail of how all of this was discovered,
by whom, and in what order, but from the 17th to 18th centuries scientists
observed several interesting facts about gases:

* Boyle's Law: holding the amount and temperature of a gas constant, the pressure
  of that gas is inversely proportional to the volume of its container.
* Charles' Law: holding the amount and pressure of a gas constant, the volume of
  that gas is directly proportional to its temperature.
* Gay-Lussac's Law: holding the amount and volume of a gas constant, the pressure
  of that gas is directly proportional to its temperature.
* Avogadro's Law: equal volumes of gases at the same temperature and pressure
  contain the same number of molecules. That is, the _kind_ of gas doesn't matter
  when relating the temperature, pressure, and volume of a gas, only the amount.

These laws were eventually unified into a single equation relating all of these
variables, now known as the ideal gas law. $$P$$, $$V$$, and $$T$$ are pressure,
volume, and temperature, respectively. $$N$$ is the total number of molecules,
and $$k_b$$ is a universal "constant of proportionality" called _Boltzmann's
constant_.

$$ P = \frac{Nk_bT}{V} $$

To connect this to the simulation with the balls bouncing around the container,
we need to relate the motion of the molecules in the simulation to the variables
of state in the ideal gas law. The most obvious is volume, which is simply the
size of the box in the simulation. Pressure is by definition the force per unit
area, and the force of the molecules on the box is the force necessary to keep
the gas bouncing inside the box. Lastly, and least intuitively, temperature is
proportional to the average kinetic energy of the molecules, which means it
grows as the square of the average speed. Since our simulations here are 2D,
I'll slighty tweak the definitions of pressure and volume in this context:
pressure will instead be _force per length_, and volume will instead refer to
the _area_ the gas occupies. Ultimately, this doesn't really change much in the
analysis — try to convince yourself of this as we go along!

Since we ignore all of the interactions between particles, we can start by
analyzing one particle at a time, and then scale up the results to a gas of many
non-interacting particles. As our one particle bounces around in the box, and
because the box's walls are much, much more massive than the particle, the
particle's trajectory is reflected off the wall — this is perfectly analogous to
the way pool balls bounce on a billiards table, but it also warrants a bit of
explanation. We assumed that all collisions are perfectly elastic, which means
that kinetic energy is conserved by the collisions which in turn means that the
speed of the particle must be the same before and after the collision.
Furthermore, since the particle is a ball, the force between the ball and the
wall must act radially from its center to the point of contact with the wall.
Since the change in momentum must be parallel to the net force on the particle,
the velocity of the particle after the collision must be the reflection of the
velocity before across the surface normal.

![reflection diagram]({{site.url}}/assets/a-gas-made-of-bouncy-balls/reflection.svg)

Now that we've figured out how the particle bounces off the wall of the box, we
can turn our attention towards quantifying the pressure. The particle-wall
collisions are "instantaneous," which poses a slight problem in that we have an
infinite force for an infinitessimal amount of time, but the solution to this is
relatively straightforward: after the particle bounces, it must travel all the
way to the next wall before it can bounce again. Since we know how fast the
particle is going, we can compute how often it bounces off of the walls, and
therefore an average force over time. When we "scale up" to a bunch of tiny
particles in the box, there should be lots of collisions going on, so "smoothing
things out" like this isn't a problem. For simplicity, restricting us to one
dimension: let $$L$$ be the width of the box, and $$m$$ and $$v_x$$ be the mass
and velocity of the particle, respectively. Then the time between collisions is
$$\frac{2L}{v_x}$$, and the impulse (change in momentum, which is the integral
of force over time) in this period is $$2mv_x$$. This gives an average force of

$$
F_{x,avg} = \frac{\int_0^{\frac{2L}{v}}F\mathrm{d}t}{2L / v} = \frac{\cancel{2}mv_x}{\cancel{2}L / v} = \frac{mv_x^2}{L}
$$

And, dividing through by the "area" of the wall (which for our 2D gas is just the
1D length of the wall), we get an expression for the pressure:

$$
P = \frac{F_{x,avg}}{L} = \frac{mv_x^2}{L^2} = \frac{mv_x^2}{V}
$$

Now moving into two dimensions, we just need to make use of the assumption that
the particle's initial velocity is in a uniformly random direction. This means
we can parameterize the velocity by a random angle $$\theta$$ chosen from a
uniform distribution between $$0$$ and $$2\pi$$:

$$ \vec{v} = (v\cos{\theta}, v\sin{\theta}) $$

And from this we can compute the expected values of $$v_x^2$$ and $$v_y^2$$ in
terms of the overall speed $$v$$ with some _iconic_ integrals. Seriously, how
many courses made me show my work for these exact integrals? I think the answer
is at least 6!

$$
\langle v_x^2 \rangle
  = \frac{1}{2\pi}\int_0^{2\pi} (v\cos{\theta})^2 \mathrm{d}\theta
  = \frac{v^2}{2\pi}\int_0^{2\pi} \cos^2{\theta} \mathrm{d}\theta
  = \frac{v^2 \cancel{\pi}}{2\cancel{\pi}} = \frac{1}{2}v^2
$$

$$
\langle v_y^2 \rangle
  = \frac{1}{2\pi}\int_0^{2\pi} (v\sin{\theta})^2 \mathrm{d}\theta
  = \frac{v^2}{2\pi}\int_0^{2\pi} \sin^2{\theta} \mathrm{d}\theta
  = \frac{v^2 \cancel{\pi}}{2\cancel{\pi}} = \frac{1}{2}v^2
$$

Doing these integrals was maybe a bit unnecessary, so here's a slightly more
intuitive argument: since all directions are equally likely, it must be the case
that $$\langle v_x^2 \rangle$$ and $$\langle v_y^2 \rangle$$ are equal. And then
we have the Pythagorean identity $$v^2 = v_x^2 + v_y^2 = 2v_x^2 = 2v_y^2$$, which
is the same result as the previous argument.

This tells us two interesting things: first, that the pressure on the
$$y$$-axis-aligned walls is equal to the pressure on the $$x$$-axis-aligned
walls; and second, the force along the axes is nicely related to the overall
speed of the particles. Plugging this back into our equation for pressure, we
now have:

$$P = \frac{mv_x^2}{V} = \frac{mv^2}{2V} $$

This formula is still only for a "gas" with a single molecule. What if there
were more? Our assumption that the molecules don't interact with each other
makes this remarkably simple: each particle exerts the same forces on the
container, and since they have no effect on each other the forces of all the
particles are completely independent. Thus, the pressure scales directly with
the number of particles:

$$ P = \frac{Nmv^2}{2V} $$

This is tantalizingly close to the ideal gas law — but it still doesn't say
anything about temperature! In fact, it's not entirely obvious how the
temperature of a collection of bouncy balls ought to be defined. Luckily, we
stand on the shoulders of giants, and statistical mechanics gives us a
reasonable answer in the _equipartition theorem_. This theorem is kind of a
strange beast, and I remember taking a while to wrap my head around why it was
true and all of its caveats. Glossing over a lot of detail and neglecting all of
the caveats, it says that the average kinetic energy associated with each
dimension our bouncy ball gas moves in is $$\frac{1}{2}k_bT$$, which gives us
the following equation for our 2D gas, which we take as the definition of
temperature:

$$ \frac{1}{2}mv^2 = \frac{1}{2}m(v_x^2 + v_y^2) = k_bT $$

This is conveniently easy to substitute right into the previous equation, which
gives us the ideal gas law in all of its glory:

$$ P = \frac{Nk_bT}{V} $$


# So we satisfy all those caveats, right?

That's pretty neat, but it turns out the equipartition theorem isn't actually
applicable to this system — one of those caveats we glossed over in the last
section is violated. In particular, for equipartition to apply, the system must
be able to move from almost any particular configuration to almost any other
particular configuration with the same energy, a property called _ergodicity_.
Our gas in a box is not ergodic, because a particle with velocity
$$\vec{v} = \langle v_x, v_y \rangle$$ will have at most four possible velocities
over all time, all of which have the same speed!

$$ (v_x, v_y) $$

$$ (v_x, -v_y) $$

$$ (-v_x, v_y) $$

$$ (-v_x, -v_y) $$

This means there are lots of plausible states (almost all of them, actually)
that a particular instance of our gas in a box will never reach. It's worth
pointing out that this is a result of our square box — there are other container
shapes like Bunimovich stadia that _are_ ergodic, but this makes the bounces
aperiodic and therefore breaks our previous approach to calculating the
pressure. Here's a particle bouncing around a Bunimovich stadium, which
illustrates the chaotic motion of this ergodic system:

<iframe src="{{site.url}}/gas/bunimovich_gas.html" width=600 height=400></iframe>

There's another way to make this system ergodic, though, regardless of the shape
of the container: add in a second ball to our square container, and in addition
to bouncing off of the walls, let them bounce off each other. This system was
defined and proven ergodic by Yakov Sinai in 1963. It seems intuitive that if
the two particle system is ergodic, it should also be ergodic for three or more.
It turns out this is still an open mathematical question, and not nearly as many
of the systems physicists study have been proven ergodic as I would have thought.
Instead, ergodicity is often accepted as an unproven assumption. However, this
isn't actually as disturbing as I first thought: even if the ideal gas system
isn't ergodic and equipartition doesn't apply, the only gap between our model
and the ideal gas law is that $$\frac{1}{2}mv^2 = k_bT$$, or that temperature is
proportional to the average kinetic energy of the particles. How very reasonable!


# But I bet bouncy balls look cool!

Yes, that's right, bouncy balls do look cool. And I know we're all really here
for cool pictures. So let's modify the simulation to make the particles bounce
off of each other. These interactions are quite a bit more computationally
expensive to simulate (mostly because I was aiming for physical accuracy, and
put in no effort at optimization), so this one is done with a much more modest
50 particles, initialized similarly to before: the particles are placed randomly
in the box, with a fixed initial speed moving in a uniformly random direction:

<iframe src="{{site.url}}/gas/interacting_gas.html" width=400 height=400></iframe>

One thing that immediately jumps out to me here (though admittedly I was looking
for this before I even wrote the simulation!) is that the speeds are no longer
constant: the collisions are elastic, so kinetic energy is conserved, but
depending on how two particles collide, one may bounce away with more than it
came with. If we make a "live" histogram of the particle speeds along with our
simulation, we can see that we relatively quickly approach a particular
steady-state distribution. This particular distribution is an important one in
statistical mechanics, as similar distributions occur for lots of different
classical systems. It is called the _Maxwell-Boltzmann distribution_, and it has
the following equation for our 2D gas:

$$ P(|\vec{v}| = v) = \frac{mv}{k_bT} \exp{\bigg(-\frac{\frac{1}{2}mv^2}{k_bT}\bigg)} $$

Indeed, we can see plausible agreement with this distribution for this
simulation. In order to make this clear, I've increased the particle number to
make the "shape" of the histogram more definite, and also decreased the size of
the particles so that there are fewer collisions, which makes the simulation run
faster.

<iframe src="{{site.url}}/gas/speed_histogram.html" width=800 height=400></iframe>


# Some other fun things!

If we start with a gas with no molecular motion — that is, one at absolute zero
— and a single excited molecule, we can watch this excitation put all of the
other molecules into motion.

<iframe src="{{site.url}}/gas/cold_gas.html" width=400 height=400></iframe>

Perhaps a bit similarly, if we mark our molecules with colors, we can also watch
the distinct gases diffuse into each other. In this simulation, all of the
particles that start on the left of the screen are red, and those on the right
are green.

<iframe src="{{site.url}}/gas/mixing_gas.html" width=400 height=400></iframe>

