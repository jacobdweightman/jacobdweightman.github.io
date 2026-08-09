---
layout: post
title:  "Finite Element Method: Zero to Hero"
date:   2026-08-06 00:00:00 -0600
categories: physics
mathjax: true
---

Maybe you've seen cool engineering graphics like this one before. This is a
model of heat computed over a 3D model of a practical part. I wanted to
understand how to make these kinds of simulations myself, and thought I'd 
document my process and learnings here.

<figure class="attributed-image">
  <img src="{{site.url}}/assets/finite-elements/FEM_example.jpg" alt="A cool finite element method simulation">
  <figcaption>
    "Visualisation of heat transfer in a pump casing" by <a href="https://commons.wikimedia.org/wiki/User:User_A1">User A1 at Wikimedia Commons</a>, licensed under
    <a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a>
  </figcaption>
</figure>
<!--more-->

## The Problem

The finite element method (FEM) is fundamentally a computational method for
finding approximate solutions to differential equations. Differential equations
pop up all over the place in the physical sciences — in physics, Newton's second
law, Maxwell's equations, and the Schrödinger equation sit at the core of
classical mechanics, electromagnetism, and quantum mechanics, respectively. In
chemistry, they appear in models of kinetics and diffusion, and in engineering
they model heat, fluids, and the deformation of solids. All of these offer
potential applications of FEM, but it's this last one — deformation of solids —
that we'll be focusing on here.

Differential equations generally fall into two categories. The first, and I
think easier to understand, is called an _initial value problem_ (IVP).
Typically, in Newtonian mechanics you're given the complete state of the system
at some point in time — for one particle, an instantaneous position and velocity
suffices. Then Newton's second law (the differential equation) allows you to
compute the acceleration from the position and velocity. Since velocity is the
derivative of position and acceleration is the derivative of velocity, one can
approximate the state of the system a short amount of time $$\Delta t$$ later as
$$\vec{v} = \vec{a} \Delta t$$ and $$\vec{r} = \vec{v} \Delta t$$, and repeating
this to reach an approximate state at any future time. Any IVP can be solved with
this so-called "forward Euler method," since a complete description at one point
in the domain tells you about the behavior at nearby points. There are, of
course, more accurate methods for approximating solutions, but hopefully the
forward Euler method gives some good intuition.

The other class of differential equation problems are called _boundary value
problems_ (BVPs). Here, the _boundary conditions_ are spread out over two or
more points in the domain, but with an incomplete description at any particular
one of them. For example, we might know the position of the particle at the
beginning of some time interval and its velocity at the end, or vice versa. The
important thing to note here is that the forward Euler method fundamentally
doesn't work here, at least not like it did before. If we know the initial
position but not velocity, we can't reliably estimate its position after
$$\Delta t$$. At best, we can guess the initial velocity, integrate, and see if
the result lines up with the other boundary condition at the end, and iterate
until we find an acceptably close solution — this approach is called "the
shooting method," which I take as an analogy for aiming a cannon by firing blind,
looking where the cannonball landed, and adjusting until you hit the target. FEM
is a more refined approach to this problem.


## The Theory

The finite element method approaches BVPs by turning them into linear algebra
problems. As such, they work best with linear differential equations, i.e.
equations where the solutions form a vector space. Unfortunately, in general the
solutions are sufficiently smooth real-valued functions over an interval, which
is an infinite dimensional vector space (consider as a basis the set of monomials
$$f_i(x) = x^i$$, all of which are smooth functions), which means computing over
this translation isn't feasible. Instead, we need a finite dimensional function
space that contains reasonably accurate approximations of arbitrary function. To
this end, let $$\Omega$$ be the closed interval $$[a, b]$$ we're solving over,
and let $$M \subseteq \Omega$$ be a finite subset that contain the endpoints,
which we call the _mesh_. We can then pick our basis to be the _tent functions_
over $$M$$:

$$
T_{x_i}(x) \coloneqq \begin{cases}
    \frac{x - x_{i-1}}{x_i - x_{i-1}} & \mathrm{if} & x_{i-1} < x < x_i \\
    \frac{x_{i+1} - x}{x_{i+1} - x_i} & \mathrm{if} & x_i \le x < x_{i+1} \\
    0 & \mathrm{otherwise} \\
\end{cases} \\

T_{x_i}'(x) = \begin{cases}

\end{cases} \\
$$

where we take $$T_a$$ and $$T_b$$ to be "half tent functions" which are only
defined on $$\Omega$$ anyway. The tent functions look like this:

![An archetypical tent function]({{site.url}}/assets/finite-elements/tent_function.png)

This gives us an $$|X|$$-dimensional vector space of continuous, piecewise linear
functions, which can approximate functions reasonably well with a careful choice
of the set $$X$$ — this will be one of the tunable parameters when using FEM in
practice. We call this vector space $$P_1(X)$$. Given a function
$$f : \mathbb{R} \rightarrow \mathbb{R}$$, it's easy to find a projection
$$\pi : (\mathbb{R} \rightarrow \mathbb{R}) \rightarrow P_1(X)$$ that gives a
function in our new space that agrees at every point in $$X$$:

$$
\pi f(x) = \sum_{x_i \in X} f(x_i) \cdot T_{x_i}(x)
$$

Now solving the BVP basically amounts to finding a good approximation of the
"true" solution in this finite dimensional vector space. One big problem though
is that these piecewise linear functions aren't differentiable at points in
$$X$$, and at any other point their second derivatives are always zero! There's
a clever trick to get around this, which is to switch to a _weak formulation_ of
the differential equation. The particulars of this vary a bit depending on the
exact structure of the equation to be solved, but the core idea is that if we
have some differential equation of the form

$$
\mathcal{F}(x, u, u', \ldots, u^{(n)}) = f(x)
$$

we can introduce a _test function_ $$v(x)$$, and if $$u$$ is a solution to the
differential equation then it must also be the case that

$$
\int_\Omega \mathcal{F}(x, u, u', \ldots, u^{(n)}) v(x) \mathrm{d}x = \int_\Omega f(x) v(x) \mathrm{d}x
$$

Note that $$u$$ satisfying this second equation doesn't mean that it is a
solution to the original differential equation, which is why we call it a "weak
formulation." This is also kind of the point: piecewise linear functions aren't
usually solutions to "interesting" differential equations, since their first
derivatives are piecewise constant and their second derivatives are zero
wherever they exist. Nevertheless, this turns out to be helpful for finding
approximate solutions.

The general procedure from here is to choose $$v$$ to be a basis function, and
express $$u$$ in terms of a linear combination of basis functions. This turns
the left side of our weak formulation equation into an integral of sum(s), which
can be interchanged into sums of integrals of our basis functions. These
integrals give rise to the _stiffness matrix_ of the system. Meanwhile the right
side of the weak formulation gives rise to the _load vector_:

$$ b_i = \int_\Omega f(x) T_{x_i}(x) \mathrm{d}x $$

If we take

$$
u(x) = \sum_{x_i \in X} \xi_i T_{x_i}(x)
$$

Then the goal is to derive a linear system of the form

$$
A \vec{\xi} = \vec{b}
$$

There are obviously a lot of gaps here which will need to be filled in with
more specific details for the particular problems we want to solve, which will
be spelled out in more detail in the following sections.


## A 1D Linear Bar

Like I said before, my original motivation for learning FEM was to study the
deformation of solids, so all of the examples will follow in that vein. The
first system is really simple: consider a one meter long bar. Fix the left end
at the origin, and point the bar along the $$+x$$ axis. Apply a force $$F$$ at
the right end, which will stretch or compress the bar so that the right end is
no longer quite at the one meter mark.

**TODO: picture**

To model this system, we'll need material coordinates: let this coordinate $$X$$
range from 0 to 1 meter, and correspond to the part of the bar that "started
out" at that position before the force was applied. For example, $$X=0$$ is the
left end of the bar, $$X=1$$ is the right end of the bar, and in general there's
some displacement $$u(X)$$ that tells us how far the piece of the bar at $$X$$
is from where it started. This means that $$x = X + u(X)$$.

We'll consider the bar to be a linearly elastic material — any material can be
approximated this way for sufficiently small deformations, but this assumption
breaks down for large deformations. The stiffness depends on the material, which
amounts to a material property called the Young's Modulus $$E$$, and the
cross-sectional area of the bar. The stiffness of the bar grows linearly with
both, so we'll reduce them to a single quantity that may vary over the length of
the bar $$\mathrm{EA}(X)$$. You could imagine this quantity varying because the
bar is thicker in some places than others, or because the material itself is
different in different parts of it.

If the internal load on the bar, which might include the weight of the bar
itself, is given by $$f(X)$$, then we have this equation for the balance of
forces:

$$
\frac{\mathrm{d}}{\mathrm{d}X} \left[ \mathrm{EA}(X) \frac{\mathrm{d}u}{\mathrm{d}X} \right] = -f(X)
$$

Together with the boundary conditions that the left end of the bar is fixed at
the origin and the force at the right end is equal to $$F$$.

$$
\begin{align*}
u(0) &= 0 \\
u'(1) &= \frac{F}{\mathrm{EA}(1)} \\
\end{align*}
$$

For any test function $$v(X)$$, we have the weak formulation

$$
\int_0^1 \frac{\mathrm{d}}{\mathrm{d}X} \left[ \mathrm{EA}(X) \frac{\mathrm{d}u}{\mathrm{d}X} \right] v(X) \mathrm{d}X
 = -\int_0^1 f(X) v(X) \mathrm{d}X
$$

The left side, notably, is amenable to integration by parts. Since we have the
essential boundary condition $$u(0) = 0$$, we also take $$v(0) = 0$$, and use
the other boundary condition to rewrite in terms of $$F$$:

$$
\begin{align*}
\int_0^1 \frac{\mathrm{d}}{\mathrm{d}X} &\left[ \mathrm{EA}(X) u'(X) \right] v(X) \mathrm{d}X \\
 &= \left[ \mathrm{EA}(X) u'(X) v(X) \right]\big|_0^1 - \int_0^1 \mathrm{EA}(X) u'(X) v'(X) \mathrm{d}X \\
 &= F v(1) - \int_0^1 \mathrm{EA}(X) u'(X) v'(X) \mathrm{d}X
\end{align*}
$$

Now taking $$u(X)$$ to be a function in $$P_1(X)$$, we have

$$
\begin{align*}
F v(1) - \int_0^1 &\mathrm{EA}(X) u'(X) v'(X) \mathrm{d}X \\
 = F v(1) - \int_0^1 &\mathrm{EA}(X) \left[ \sum_{x_i \in X} u'(X) \right] v'(X) \mathrm{d}X

\end{align*}
$$


Taking $$v(X) = T_{x_i}(X)$$ for some arbitrary $$x_i \in X$$, we have that
$$v(1) = 0$$ except for $$x_i = 1$$ where it is $$1$$:

$$
foo
$$
