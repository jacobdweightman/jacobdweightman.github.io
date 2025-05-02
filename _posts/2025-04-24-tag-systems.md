---
layout: post
title:  "The Problem of Tag"
date:   2025-4-27 00:00:00 -0600
categories: computation
mathjax: true
---

Sometime last year, I was reading up on a longstanding open math problem that
turns out to have a really deep connection with computability theory <a href="#cit1">[1]</a>.
For the unfamiliar reader, this is a corner of theoretical computer science that
deals with "math computers" — basically, defining mathematical objects that can
do computations, and proving mathematical theorems about them. These math
computers are more formally called _models of computation_, and there are some
really common ones like state machines and context free grammars that every
programmer probably encounters at some point in their career. I'm probably
biased though, since I'm a compiler engineer during standard working hours, so
these are kind of my bread and butter.

Anyway, this researcher, Liesbeth De Mol, used a kind of math computer called a
tag system to do number theory, and I think that's neat. I wasn't familiar with
this model before, which isn't surprising because there is a vast zoo of obscure
models of computation, but this kind turns out to be particularly interesting.
The history of their development is long and storied, and starts with Emil Leon
Post (who is probably better known for his other contributions like the
[Post correspondence problem](https://en.wikipedia.org/wiki/Post_correspondence_problem)).
Post posed the problem of "predicting" the behavior of tag systems as early as
1920, which he cutely named "the problem of tag" after the classic recess game.
Less cutely, it turns out that this problem is equivalent to the halting
problem, and is therefore provably impossible to solve in general. Interestingly,
this represents a relatively early brush with the limits of decidability, and
runs in tandem with many of the other major developments of computability theory.
De Mol has also written a thorough accounting of this history in a few places
<a href="#cit2">[2]</a><a href="#cit3">[3]</a>, which is definitely worth
checking out if you're curious.

## Understanding Tag Systems

So... what actually is a tag system? I'll start with an intuitive explanation.
Imagine a clear, narrow tube full of marbles of various colors. Following a very
simple set of rules, we'll pull a fixed number marbles of various colors out of
one end of the tube, and depending on the color of the first one, we'll add some
sequence of marbles in the other end. Because the tube is narrow, the marbles
stay in order. Because the tube is clear, we can watch them go by as we go along
removing and adding marbles. The process looks something like this:

![A simple tag system?]({{site.url}}/assets/tag-systems/tag_system.gif)

The rules in this example are quite simple: at each step, remove two marbles from
the front of the tube. Look at the color of the first marble that was removed:
if it's red, add a red and a blue marble to the back, in that order. If it's
green, add two red marbles and a blue marble to the back. If it's blue, add a
single green marble. Note that for this tag system, we always take two marbles
out of the front, but depending on the color of the marble we take out first, we
might insert one, two, or three. This means that the number of marbles in the
tube can change! If we ever find that there aren't two marbles to take out, we
stop the process. Indeed, for our initial state of three green marbles in the
animation, we find ourselves with only one green marble in the tube after 11
steps, so we say that the tag system _halts_ on this initial state.

$$
GGG \Rightarrow GRRB \Rightarrow RBRRB \Rightarrow RRBRB \\
    \Rightarrow BRBRB \Rightarrow BRBG \Rightarrow BGG \\
    \Rightarrow GG \Rightarrow RRB \Rightarrow BRB \\
    \Rightarrow BG \Rightarrow G
$$

Tag systems don't always halt. There are two other behaviors that are possible:
we might eventually come back to some sequence of marbles that has happened
before, and because the way we proceed is deterministic, we will do this over
and over again. When this happens, we say that the tag system _loops_. It's also
possible to do neither of these things by having an ever-growing sequence of
marbles, in which case we say that the tag system _diverges_. Note that a
particular tag system might do different things on different initial sequences
of marbles. To make this concrete, here's a sequence for our example tag system that loops every three steps:

$$
GRB \Rightarrow BRRB \Rightarrow RBG \Rightarrow GRB \Rightarrow \dots
$$

You could also imagine that a tag system neither halts nor loops on a particular
initial state. This is possible if the string keeps on growing indefinitely, in
which case we say that the tag system _diverges_ on the initial state. This one
seems to be the trickiest to prove or reason about. For our example tag system,
I _think_ it always either halts or loops, but I haven't been able to prove it
yet. For an example of a system that can diverge, consider the following tag
system:

$$
\begin{cases}
\mathrm{remove}\, 2\, \mathrm{marbles} \\
R \rightarrow G \\
G \rightarrow RG \\
B \rightarrow BBB
\end{cases}
$$

This tag system diverges when starting with two blue marbles, because on each
step we remove two blue marbles and add three more.

$$ BB \Rightarrow BBB \Rightarrow BBBB \Rightarrow \dots $$

Now you should have all the intuition necessary to understand Post's "problem
of tag:" given the rules of a particular tag system and a particular initial
state, does the tag system eventually halt, loop, or diverge?


## Into the Weeds

My actual intention with writing this post is to describe some formalization
work I've been doing to systematize results about tag systems in the Lean
theorem prover, so everything that follows is going to be a bit dry and very
formal. In formal mathematical style, we'll start with definitions and enumerate
some theorems in a carefully chosen order. In less formal style, I'll include
some informal exposition for each proof as we go along, so that you can choose
your own adventure and read only the theorems, or the first paragraph of each
proof, or the whole proof, and get a progressively more detailed but coherent
picture in any case. If you find your eyes glazing over, feel free to start
skimming!

Now let's get to it. Instead of talking about marbles and tubes, we'll now start
talking about an _alphabet_ and _strings_. Let $$\Sigma$$ be a finite set we
call the _alphabet_, and whose elements we call _symbols_. Finite sequences of
symbols are called _strings_, which we denote $$\Sigma^\ast$$. A tag system is
defined by a _deletion number_ $$v > 0$$, alphabet $$\Sigma$$, and a function
$$\sigma : \Sigma \rightarrow \Sigma^\ast$$ that associates each symbol with the
string that should be appended. That is, a tag system is a tuple $$T =
(v, \Sigma, \sigma)$$.

Now we can define the semantics of the tag system. For starters, we say that
$$T$$ has halted on a string $$A$$ iff $$|A| < v$$. We also define the function
$$next$$ in terms of _concatenation_ ($$\texttt{++}$$) which joins two strings
together one after the other, $$drop$$ which removes the given number of symbols
from the start of a string, and $$head$$ which gives the first symbol of a
string:

$$
next(T, A) \coloneqq \begin{cases}
A & \mathrm{if} \, halted(T, A) \\
drop (A \, \texttt{++} \, \sigma(head(A)), v) & \mathrm{otherwise}
\end{cases}
$$

And then we can define our "end behaviors" in terms of $$next$$. Halting is the
most straightforward of the three: the tag system halts on $$A$$ if there is
some number of steps $$n$$ after which it has halted.

$$
halts(T, A) \coloneqq \exists n \in \mathbb{N}, halted(T, next^n(T, A))
$$

Looping is not much more complicated, but we require an auxilary definition.
When a tag system loops on a string, it doesn't necessarily start in the loop
itself — it may have a transient before settling into the repeating states.
Thus, we call a state periodic with period $$p$$ iff we return to that state
after $$p$$ steps, and a tag system loops on a string iff it becomes periodic
after $$t$$ steps. Because $$next(T, A) = A$$ if $$T$$ is halted on $$A$$, we
explicitly exclude this case. Furthermore, because $$next^0(T, A) = A$$, we also
require that $$p$$ is at least 1.

$$
periodic(T, A, p) \coloneqq \neg halted(T, A) \wedge 0 < p \wedge next^p(T, A) = A \\
loops(T, A) \coloneqq \exists t, p \in \mathbb{N}, periodic(T, next^t(T, A), p)
$$

The messiest of the three is divergence. There are actually multiple distinct
definitions used in the literature. The first is more "intuitive" to me, and I
see in a lot of the older sources, which I call _weak divergence_: $$T$$ weakly
diverges on $$A$$ iff we can always find an even longer string later in the
computation. Symbolically:

$$ diverges(T, A) \coloneqq
    \forall i \in \mathbb{N},
    \exists j \in \mathbb{N},
    j > i \wedge length(next^j(T, A)) > length(next^i(T, A)) $$

The second definition is the one used by De Mol<a href="#cit3">[3]</a>, which I
call _strong divergence_. $$T$$ strongly diverges on $$A$$ iff for any length
$$n$$, there is a "point of no return" $$i$$ where the string never gets shorter
than $$n$$. Symbolically:

$$ diverges'(T, A) \coloneqq
    \forall n \in \mathbb{N},
    \exists i \in \mathbb{N},
    \forall j > i,
    length(next^j(T, A)) > n $$


## Some meaningful results

Now that I've been really pedantic and formal in these definitions, it's time
to do some really pedantic and formal proofs. After reading a handful of papers
on tag systems, including Post's paper from the 1940s that first defined them,
I've never seen anyone bother to prove the following results. Indeed, I only
really thought to prove them when I started trying to work with tag systems in
the Lean theorem prover — for better or worse, interactive theorem provers don't
let you skip any steps (though some are more automated than others). As a
result, one often finds themselves spending a lot of time trying to prove really
basic things. In this particular case, this meant proving that halting, looping,
and diverging are mutually exclusive and exhaustive — that is, a tag system
operating on a particular string always does exactly one of those three things.
It also meant proving that weak divergence and strong divergence are equivalent,
and therefore it is appropriate to simply speak of divergence. All of the Lean
definitions and proofs can be found on [my fork of Mathlib](https://github.com/jacobdweightman/mathlib4/tree/jacob/tag-systems).


### Mutual exclusion

Our goal in this section is to prove the following theorem:

<b>Theorem 1:</b> For a tag system $$T$$ and a string $$A$$ over the alphabet of
$$T$$, no more than one of the following is true:

$$
halts(T, A) \\
loops(T, A) \\
diverges'(T, A)
$$

We can prove this by showing that taking any pair of these statements leads to
a contradiction, which we do in a series of lemmas to be combined later.

<b>Lemma 1:</b> $$T$$ cannot both halt and loop on $$A$$.

<b>Proof:</b> Suppose that $$T$$ halts on $$A$$ in $$s$$ steps, and that $$T$$
also loops on $$A$$, with transient $$t$$ and period $$p$$. We now show the
former assumption implies that the computation has halted at a particular future
step, whereas the latter assumption implies that the same step has not, which is
a contradiction and will complete the proof.

First, note that if $$halted(T, A')$$, then also $$halted(T, next(T, A'))$$.
This follows from the definition of $$next$$, since $$halted(T, A')$$ we have
that $$next(T, A') = A'$$. Inductively, this is true for all subsequent steps,
which is to say that $$\forall i \in \mathbb{N}, halted(T, A') \rightarrow
halted(T, next^i(T, A'))$$.

Next, note that $$1 \le p$$. Multiplying both sides by $$s$$, we have that
$$s \le ps$$. Now add $$t$$ to the right side of the inequality, which shows
that $$s \le ps + t$$. Since $$T$$ halts on $$A$$ in $$s$$ steps, it is also
halted after $$ps + t$$ steps, which is to say $$halted(T, next^{ps+t}(T, A))$$.

However, because $$loops(T, A)$$, we have $$periodic(T, next^t(T, A), p)$$. From
the definition of $$periodic$$, we have that
$$next^t(T, A) = next^p(T, next^t(T, A)) = next^{p+t}(T, A)$$. We can apply this
procedure arbitrarily many times, incrementing the exponent by $$p$$ each time,
and so by induction we have that $$\forall n \in \mathbb{N},
next^t(T, A) = next^{pn+t}(T, A)$$, and taking $$n = s$$, we have that
$$next^t(T, A) = next^{ps+t}(T, A)$$. Now, since $$periodic(T, next^t(T, A), p)$$,
we have $$\neg halted(T, next^t(T, A))$$, which is equivalent to
$$\neg halted(T, next^{ps+t}(T, A))$$, which is the contradiction we were
looking for.
<p style="text-align:right; margin-top: -2em">□</p>

<b>Lemma 2:</b> $$T$$ cannot both halt and strongly diverge on $$A$$.

<b>Proof:</b> suppose that $$T$$ halts on $$A$$ in $$s$$ steps, and that $$T$$
also strongly diverges on $$A$$. As before, the former assumption ensures that
the computation has halted at a particular future step, whereas the latter
implies that it does not.

First, we turn our attention towards strong divergence. Taking $$n = v$$ in the
definition of strong divergence, we have some $$i \in \mathbb{N}$$ such that
$$ \forall j > i, length(next^j(T, A)) > v $$. We can weaken this inequality to
$$ \forall j > i, length(next^j(T, A)) \ge v $$, which can now be rewritten in
terms of $$halted$$ as $$ \forall j > i, \neg halted(T, next^j(T, A)) $$.

However, because $$halts(T, A)$$, we have
$$\forall j \ge s, halted(T, next^j(T, A))$$ by the same argument as the last
proof. This leads to our contradicition: let $$t = max(s, i+1)$$, so that
$$t > i$$ and $$t \ge s$$. Since $$t > i$$, we have $$\neg halted(T, next^t(T, A))$$,
but because $$t \ge s$$, we also have $$halted(T, next^t(T, A))$$, which is a
contradiction.
<p style="text-align:right; margin-top: -2em">□</p>


<b>Lemma 3:</b> $$T$$ cannot both loop and strongly diverge on $$A$$.

<b>Proof:</b> Suppose that $$T$$ loops on $$A$$ with transient $$t$$ and period
$$p$$. We will show that this means strings of a certain length reoccur
arbitrarily far into the computation, which contradicts strong divergence.

Let $$n = length(next^t(T, A))$$ be the length of the first string reached in
the cycle. By the same argument used in lemma 1, we have that $$\forall m \in \mathbb{N},
next^t(T, A) = next^{pm+t}(T, A)$$. By the definition of $$n$$, it follows that
$$\forall m \in \mathbb{N}, length(next^{pm+t}(T, A)) = n$$.

However, by the definition of divergence, taking the string length to be $$n$$,
we have $$i \in \mathbb{N}$$ such that $$\forall j > i, length(next^j(T, A)) > n$$.
Note that $$i + 2 > i$$, and since $$p > 0$$ we have that $$p (i + 2) + t > i$$.
Therefore, $$length(next^{p (i + 2) + t}(T, A)) > n$$. On the other hand, taking
the result from the previous paragraph with $$m = i + 2$$, we have that
$$length(next^{p(i+2)+t}(T, A)) = n$$, which is a contradiction.
<p style="text-align:right; margin-top: -2em">□</p>

<b>Theorem 1:</b> For a tag system $$T$$ and a string $$A$$ over the alphabet of
$$T$$, no more than one of the following is true:

$$
halts(T, A) \\
loops(T, A) \\
diverges'(T, A)
$$

<b>Proof:</b> suppose for the sake of contradiction that more than one of the
statements are true. Then at least two of the statements are true. This means
we have at least one of the following cases:

_case 1:_ $$halts(T, A) \wedge loops(T, A)$$, which is a contradiction by lemma 1.

_case 2:_ $$halts(T, A) \wedge diverges'(T, A)$$, which is a contradiction by lemma 2.

_case 3:_ $$halts(T, A) \wedge diverges'(T, A)$$, which is a contradiction by lemma 3.
<p style="text-align:right; margin-top: -2em">□</p>


### Exhaustiveness

In the last section, we proved that a tag system operating on a string has at
most one of our end behaviors. In this section we show that it is an exhaustive
list, which is to say that we also have at least one of our end behaviors. This
proves that we haven't missed any possibilities.

<b>Theorem 2:</b> For a tag system $$T$$ and a string $$A$$ over the alphabet of
$$T$$, $$halts(T, A) \vee loops(T, A) \vee diverges'(T, A)$$.

<b>Proof:</b> either $$T$$ strongly diverges on $$A$$ or it does not. If it
does, then the claim trivially follows. So now, suppose $$\neg diverges'(T, A)$$.
We now show $$halts(T, A) \vee loops(T, A)$$.

First, note that applying De Morgan's law on $$\neg diverges'(T, A)$$ tells us
there is some string length $$n$$, such that $$\forall i : \mathbb{N},
\exists j > i, length(next^j(T, A)) \le n$$. This means that for any threshold
step number $$i$$, we can always find some step number $$j > i$$ such that
$$next^j(T, A)$$ is no longer than $$n$$. The crux of the proof is that we can
therefore find infinitely many indices of strings shorter than $$n$$, but there
are finitely many such strings, which means one of them must be repeated.

Invoking the axiom of choice, there is some
function $$\varphi : \mathbb{N} \rightarrow \mathbb{N}$$ that takes in $$i$$ and
returns such a $$j$$. Without loss of generality, suppose that $$\varphi$$ is
strictly monotone. Now define a new function $$f(i) \coloneqq next^{\varphi(i)}(T, A)$$.
By the definition of $$\varphi$$, it must be that $$\forall i \in \mathbb{N}, length(f(i)) \le n$$.
Because there are finitely many strings of length less than or equal to $$n$$,
by the pigeonhole principle $$\exists i_1, i_2 \in \mathbb{N}, i_1 \ne i_2
\wedge f(i_1) = f(i_2)$$. Again without loss of generality, suppose $$i_1 < i_2$$.

Because we have a repeated string, we are ready to show that the tag system
halts or enters a loop. It's easy to tell these two cases apart by the length
of the string. Now, either $$length(f(i_1)) < v$$ or it is not.

_Case 1:_ suppose $$length(f(i_1)) < v$$. Then we have that
$$length(next^{\varphi(i_1)}(T, A)) < v$$, so
$$halted(T, next^{\varphi(i_1)}(T, A))$$. Therefore $$halts(T, A)$$.

_Case 2:_ suppose $$length(f(i_1)) \ge v$$. Then we have
$$\neg halted(T, next^{\varphi(i_1)}(T, A))$$. We also have that
$$next^{\varphi(i_1)}(T, A) = next^{\varphi(i_2)}(T, A)$$, so
$$periodic(T, next^{\varphi(i_1)}(T, A))$$ with period $$i_2 - i_1$$,
and therefore $$loops(T, A)$$.
<p style="text-align:right; margin-top: -2em">□</p>


### Strong divergence and weak divergence are equivalent

You may be wondering why I didn't prove the two definitions of divergence
equivalent right after defining them. It turns out the proof is nontrivial, and
taking advantage of the last two theorems was quite economical. The only new
building blocks we need here are mutual exclusion lemmas for weak divergence.

<b>Lemma 4:</b> $$T$$ cannot both halt and weakly diverge on $$A$$.

<b>Proof:</b> suppose that $$T$$ halts on $$A$$ in $$s$$ steps. By the definition
of $$diverges$$ and DeMorgan's law, we want to show that
$$ ∃i \in \mathbb{N}, ∀ j > i, length(next^j A) ≤ length(next^i A) $$. It happens
that $$s$$ is such a number: since $$halted(T, next^s(T, A))$$, we have that
$$next^j(T, A) = next^s(T, A)$$, and therefore $$length(next^j A) ≤ length(next^s A)$$ for
all $$j > s$$.
<p style="text-align:right; margin-top: -2em">□</p>

<b>Lemma 5:</b> $$T$$ cannot both loop and weakly diverge on $$A$$.

<b>Proof:</b> suppose that $$T$$ loops on $$A$$ with transient $$t$$ and period
$$p$$. We will show that no string longer than the longest string in the loop
occurs after entering the loop, which contradicts weak divergence.

First, we must construct the longest string in the loop. Let $$L$$ be the
sequence of $$p$$ strings that occur in the loop. That is, $$L_j \coloneqq
next^{t+j}(T, A), 0 \le j < p$$. Let $$i$$ be the index of the longest string in
$$L$$; if there are multiple strings of the longest length, take $$i$$ to be the
smallest index of such a string. By construction, we have that $$\forall
0 \le j < p, length(next^{t+j}(T, A)) \le length(next^{t+i}(T, A)) $$.

Now by the definition of $$diverges$$ and De Morgan's law, the claim is that
there is some step of the computation after which a longer string is never
produced. That is, $$ ∃i' \in \mathbb{N}, ∀ j > i', length(next^j(T, A)) ≤
length(next^{i'}(T, A)) $$. Let's demonstrate that $$t + i$$ is such a value.
Now, for any $$j > t + i$$, we also have that $$j \ge t$$. Let
$$\delta = j - t \in \mathbb{N}$$. It now suffices to show that
$$\forall \delta \in \mathbb{N}, length(next^{t+\delta}(T, A)) \le length(next^{t+i}(T, A))$$.

To do this, decompose $$\delta$$ into its quotient and remainder divided by $$p$$.
That is, define $$q, r \in \mathbb{N}$$ such that $$\delta = qp + r$$ and
$$r < p$$. We proceed by induction on $$q$$: if $$q = 0$$, then we have
$$\delta = r < p$$, and the claim follows by construction of $$i$$. Now we have
the induction hypothesis $$length(next^{t + qp + r}(T, A))
\le length(next^{t+i}(T, A)) $$. By periodicity, we have that
$$next^{t + qp + r}(T, A) = next^{(t + qp + r) + p}(T, A) = next^{t + (q+1)p + r}(T, A)$$,
which we can substitute to obtain
$$length(next^{t + (q+1)p + r}(T, A)) \le length(next^{t+i}(T, A)) $$ which
completes our inductive argument. Therefore, the length of the string after
$$i$$ steps is bounded by $$length(next^{t+i}(T, A))$$, and $$T$$ does not
weakly diverge on $$A$$.
<p style="text-align:right; margin-top: -2em">□</p>


<b>Theorem 3:</b> $$diverges'(T, A) \iff diverges(T, A)$$

<b>Proof:</b> proving weak divergence from strong divergence, as the names
imply, is possible with a straightforward direct proof. Suppose
$$diverges'(T, A)$$. To show that $$diverges(T, A)$$, we need to prove that
$$\forall i \in \mathbb{N}, \exists j \in \mathbb{N}, j > i \wedge
length(next^j(T, A)) > length(next^i(T, A))$$.

Let $$n \coloneqq length(next^i(T, A))$$, and let $$i'$$ be the threshold of
strong divergence for strings of length $$n$$, so that $$\forall j > i',
length(next^j(T, A)) > n$$. Now, for any given $$i$$, taking $$j \coloneqq
max(i+1, i'+1)$$ suffices. Clearly $$max(i+1, i'+1) \ge i+1 > i$$. We also have
that $$max(i+1, i'+1) \ge i'+1 > i'$$, so $$length(next^j(T, A)) >
length(next^i(T, A))$$. Therefore, $$diverges'(T, A) \rightarrow diverges(T, A)$$.

Next, to show that weak divergence implies strong divergence, consider the
contrapositive. Suppose $$\neg diverges'(T, A)$$. By theorem 2, we have that
$$halts(T, A) \vee loops(T, A)$$. Consider the two cases separately:

_Case 1:_ suppose $$halts(T, A)$$. By lemma 4, we have $$\neg diverges(T, A)$$.

_Case 2:_ suppose $$loops(T, A)$$. By lemma 5, we have $$\neg diverges(T, A)$$.
<p style="text-align:right; margin-top: -2em">□</p>


## Remarks

Even though all of these theorems are at some level intuitively obvious — for
example, clearly a thing that stops doesn't get caught in a loop — it turns out
that none of the proofs are as trivial as the tag system literature would have
you believe. Indeed, these claims have been brushed of as "obvious" for close to
80 years, and I personally only bothered to write these proofs because the Lean
theorem prover pointed out these gaps in my reasoning for more complicated
theorems. I don't expect anyone to be all that interested in these proofs
themselves, but they do represent a step forward in the Lean formalization of
tag systems that is my real contribution.

My efforts have also shown several gaps in the published research on tag systems. one cause of this is Post's tendency to reference his own unpublished work
<a href="#cit1">[4]</a>, and another is the abundance of paywalls and bit rot of
old math publications. There are several important results that I am familiar
with through citations, but cannot access the original works. Overall, I hope to
contribute a meaningful systematization of this work. I already have another
post planned with some more theorems, so stay tuned!


<label id="cit1">[1]</label> Liesbeth De Mol. _Tag systems and Collatz-like functions_. Theoretical Computer Science, Volume 390, Issue 1, 2008, Pages 92-101. [Link](https://doi.org/10.1016/j.tcs.2007.10.020)

<label id="cit2">[2]</label> Liesbeth De Mol. _Tracing Unsolvability: A Mathematical, Historical and Philosophical Analysis with a Special Focus on Tag Systems_. Ghent University. Faculty of Arts and Philosophy, 2007.

<label id="cit3">[3]</label> Liesbeth De Mol. _Solvability of the Halting and Reachability Problem for Binary 2-tag Systems_. Fundamenta Informaticae, Volume 99, Issue 4, 2025, Pages 435-471. [Link](https://dl.acm.org/doi/10.5555/1834610.1834614).

<label id="cit3">[4]</label> Emil Leon Post. _Formal Reductions of the General Combinatorial Decision Problem_.  American Journal of Mathematics, Volume 65, NO 2, 1943. [Link](https://www.jstor.org/stable/2371809).